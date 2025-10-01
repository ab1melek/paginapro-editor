import { NextResponse } from "next/server";
import { getAllPagesWithData } from "../services/getAllPagesWithData.db.service";
import { deleteImage, saveImage } from "../services/images.services";

export async function POST(req) {
  try {
  const formData = await req.formData();
  const file = formData.get("image");
  const rawSlug = formData.get("slug") || req.headers.get('x-page-slug') || 'general';
  const slug = String(rawSlug || 'general').toLowerCase().trim().replace(/[^a-z0-9-_/]/g, '').replace(/\/+/g, '/');

    if (!file) {
      return NextResponse.json({ success: 0, error: "No se proporcionó ninguna imagen" }, { status: 400 });
    }

  // Guardar la imagen usando el servicio, pasando el slug explícitamente para evitar condiciones de carrera
  const imageUrl = await saveImage(file, slug);

    // Si saveImage devolvió una ruta relativa, prepender el origin; si ya es absoluta, usarla tal cual
    const isAbsolute = typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));
    const baseUrl = `${req.headers.get("origin") || ""}`;
    const fullUrl = isAbsolute ? imageUrl : `${baseUrl}${imageUrl}`;

    // Responder con el formato esperado por Editor.js
    return NextResponse.json({
      success: 1,
      file: { url: fullUrl }
    }, { status: 201 });
  } catch (error) {
    console.error("Error al subir la imagen:", error?.message || error);
    const msg = /2 MB/i.test(error?.message || '')
      ? 'La imagen supera 2MB. Comprime o reduce la resolución e intenta de nuevo.'
      : (error?.message || 'Error al subir la imagen');
    return NextResponse.json({ success: 0, error: msg }, { status: 400 });
  }
}

export async function DELETE(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let url = '';
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      url = body?.url || '';
    } else {
      const formData = await req.formData().catch(() => null);
      url = formData?.get('url') || '';
    }

    if (!url) {
      return NextResponse.json({ ok: false, error: 'Missing url' }, { status: 400 });
    }

    // Evitar borrar si alguna otra página sigue referenciando esta URL
    let referencedElsewhere = false;
    try {
  const pages = await getAllPagesWithData();
      referencedElsewhere = isUrlReferencedInAnyPage(url, pages);
    } catch {}

    if (referencedElsewhere) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'in-use' }, { status: 200 });
    }

    const ok = await deleteImage(url);
    return NextResponse.json({ ok }, { status: ok ? 200 : 500 });
  } catch (error) {
    console.error('Error al borrar la imagen:', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Delete failed' }, { status: 500 });
  }
}

function isUrlReferencedInAnyPage(url, pages) {
  const visit = (blocks) => {
    if (!Array.isArray(blocks)) return false;
    for (const b of blocks) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'image') {
        const u = b.data?.file?.url || b.data?.url;
        if (u === url) return true;
      }
      if (b.type === 'columns' && Array.isArray(b.data?.blocks)) {
        for (const col of b.data.blocks) {
          const colBlocks = Array.isArray(col) ? col : (col?.blocks || []);
          if (visit(colBlocks)) return true;
        }
      }
    }
    return false;
  };
  for (const p of pages || []) {
    const data = Array.isArray(p) ? (p[0] || {}) : (p || {});
    if (visit(Array.isArray(data.blocks) ? data.blocks : [])) return true;
  }
  return false;
}