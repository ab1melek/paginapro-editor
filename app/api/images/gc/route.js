import { del, list } from '@vercel/blob';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import { getAllPagesWithData } from '../../services/getAllPagesWithData.db.service';

function collectAllImageUrls(pages) {
  const urls = new Set();
  const visit = (blocks) => {
    if (!Array.isArray(blocks)) return;
    for (const b of blocks) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'image') {
        const u = b.data?.file?.url || b.data?.url;
        if (u) urls.add(u);
      }
      if (b.type === 'columns' && Array.isArray(b.data?.blocks)) {
        for (const col of b.data.blocks) {
          const colBlocks = Array.isArray(col) ? col : (col?.blocks || []);
          visit(colBlocks);
        }
      }
    }
  };
  for (const p of pages || []) {
    const data = Array.isArray(p) ? (p[0] || {}) : (p || {});
    visit(Array.isArray(data.blocks) ? data.blocks : []);
  }
  return urls;
}

export async function POST(req) {
  try {
    const tokenHeader = req.headers.get('x-gc-token');
    const envToken = process.env.GC_TOKEN || null;
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd && (!envToken || tokenHeader !== envToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pages = await getAllPagesWithData();
    const usedUrls = collectAllImageUrls(pages);

    const results = { deletedRemote: 0, deletedLocal: 0, keptInUse: 0 };

    // Limpieza en Vercel Blob si hay token RW
    const vercelBlobToken = process.env.PAGINAPRO_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    if (vercelBlobToken) {
      const blobs = await list({ token: vercelBlobToken });
      for (const blob of blobs.blobs) {
        if (!usedUrls.has(blob.url)) {
          await del(blob.url, { token: vercelBlobToken });
          results.deletedRemote++;
        } else {
          results.keptInUse++;
        }
      }
    }

    // Limpieza local en public/uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      const entries = await fs.readdir(uploadsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          const rel = `/uploads/${entry.name}`;
          if (!usedUrls.has(rel)) {
            await fs.unlink(path.join(uploadsDir, entry.name)).catch(() => {});
            results.deletedLocal++;
          } else {
            results.keptInUse++;
          }
        }
      }
    } catch (e) {
      // carpeta puede no existir, ignorar
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error('GC error:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'GC failed' }, { status: 500 });
  }
}
