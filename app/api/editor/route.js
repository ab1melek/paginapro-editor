import { cookies } from 'next/headers';
import { NextResponse } from "next/server";
import { countPagesByOwner, getPageOwnerById } from "../../../db/queries/auth.queries.js";
import { deletePageById } from "../../../db/queries/page.queries.js";
import { COOKIE_NAME, verifyToken } from "../../../lib/auth.js";
import { createPage } from "../services/createPage.db.service";
import { editPageById, getPageById } from "../services/editPageById.db.service";
import { getAllPagesWithData } from "../services/getAllPagesWithData.db.service";
import { getPageBySlug } from "../services/getPageBySlug.db.service";
import { getPagesByUser } from "../services/getPagesByUser.db.service";
import { deleteImage } from "../services/images.services";

export async function POST(req) {
    try {
        // Autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const user = token ? await verifyToken(token) : null;
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json(); // Usar await para obtener los datos correctamente
        console.log("Datos recibidos en el router:", data);
        // Bloquear creación/edición de la portada salvo para "gatunoide"
        const HOME_SLUG = (process.env.HOME_SLUG || 'paginaprolanding').toLowerCase();
        const uname = String(user.username || '').toLowerCase();
        if (String(data?.slug || '').toLowerCase() === HOME_SLUG && uname !== 'gatunoide') {
          return NextResponse.json({ error: 'Forbidden: portada solo editable por gatunoide' }, { status: 403 });
        }
        // Límite de 2 páginas para usuarios no especiales
        if (!user.is_special) {
          const cnt = await countPagesByOwner(user.id);
          if (cnt >= 2) {
            return NextResponse.json({ error: 'Límite alcanzado (2 páginas)' }, { status: 403 });
          }
        }
        const result = await createPage({ ...data, owner_id: user.id });
        return NextResponse.json(result, { status: 201 });
    } catch (error){
        console.error("Error al procesar la solicitud:", error);
        if (error?.message === 'SLUG_DUPLICATE') {
          return NextResponse.json({ error: "Slug ya existe" }, { status: 400 });
        }
        return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
    }
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (id) {
      // Obtener una página específica por id
  const page = await getPageById(id);
  console.log("Página obtenida por ID", id, page);
  return NextResponse.json(page, { status: 200 });
    } else if (slug) {
        // Obtener una página especifica por slug
  const includeOwnerStatus = searchParams.get("includeOwnerStatus") === "true";
  const page = await getPageBySlug(slug, includeOwnerStatus);
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
  }
  return NextResponse.json(page, { status: 200 });
    } else {
      // Listado por usuario: autenticado ve sus páginas; landing sólo aparece para "gatunoide"
      const cookieStore = await cookies();
      const token = cookieStore.get(COOKIE_NAME)?.value;
      const user = token ? await verifyToken(token) : null;
      if (user) {
        const result = await getPagesByUser({ userId: user.id, username: user.username });
        return NextResponse.json(result, { status: 200 });
      }
      // Sin sesión: lista vacía
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const idFromQuery = searchParams.get("id");
    const body = await req.json().catch(() => ({}));
    const id = body.id || idFromQuery;
    if (!id) {
      return NextResponse.json({ error: "Falta el id para actualizar" }, { status: 400 });
    }
    // Autenticación y autorización
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.is_special) {
      const ownerId = await getPageOwnerById(id);
      if (ownerId && ownerId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    // Obtener versión previa para detectar imágenes a eliminar
    let prevPage = null;
    try {
      prevPage = await getPageById(id);
    } catch {}

    // Regla: la portada (HOME_SLUG) solo puede editarla "gatunoide"
    const HOME_SLUG = (process.env.HOME_SLUG || 'paginaprolanding').toLowerCase();
    const uname = String(user.username || '').toLowerCase();
    const prevSlug = String((Array.isArray(prevPage) ? (prevPage[0] || {}) : (prevPage || {}))?.slug || '').toLowerCase();
    const nextSlug = String((body?.slug || '')).toLowerCase();
    if ((prevSlug === HOME_SLUG || nextSlug === HOME_SLUG) && uname !== 'gatunoide') {
      return NextResponse.json({ error: 'Forbidden: portada solo editable por gatunoide' }, { status: 403 });
    }

    // Garantizar que no se pierda el id
    const dataToUpdate = { ...body, id };

    // Calcular conjunto de imágenes antes y después
    const prevUrls = collectImageUrls(prevPage);
    const nextUrls = collectImageUrls(dataToUpdate);
    const removed = Array.from(prevUrls).filter(u => !nextUrls.has(u));

  const result = await editPageById(id, { ...dataToUpdate, owner_id: user.id });
    console.log("Página actualizada", id, result.data);

    // Borrado best-effort de imágenes removidas tras actualizar (si no están en uso por otras páginas)
    if (removed.length) {
      try {
        const pages = await getAllPagesWithData();
        const toDelete = removed.filter((u) => !isUrlReferencedInAnyPage(u, pages));
        if (toDelete.length) {
          Promise.allSettled(toDelete.map(u => deleteImage(u))).then((outs) => {
            const fails = outs.filter(o => o.status === 'rejected' || o.value === false).length;
            if (fails) console.warn(`[editor PUT] Fallos al borrar ${fails}/${toDelete.length} imágenes`);
          }).catch(()=>{});
        }
      } catch {}
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}

// Utilidad: extraer URLs de imágenes de un dato del editor (soporta wrapper [data] y columnas)
function collectImageUrls(root) {
  try {
    const set = new Set();
    const data = Array.isArray(root) ? (root[0] || {}) : (root || {});
    const visit = (blocks) => {
      if (!Array.isArray(blocks)) return;
      for (const b of blocks) {
        if (!b || typeof b !== 'object') continue;
        if (b.type === 'image') {
          const u = b.data?.file?.url || b.data?.url;
          if (typeof u === 'string' && u) set.add(u);
        }
        // hero: extrae url(...) de data.bg si existe
        if (b.type === 'hero' && b.data && typeof b.data.bg === 'string') {
          const m = b.data.bg.match(/url\(([^)]+)\)/i);
          if (m && m[1]) {
            const raw = m[1].replace(/['"]/g, '');
            if (raw) set.add(raw);
          }
        }
        if (b.type === 'columns' && Array.isArray(b.data?.blocks)) {
          for (const col of b.data.blocks) {
            const colBlocks = Array.isArray(col) ? col : (col?.blocks || []);
            visit(colBlocks);
          }
        }
      }
    };
    visit(Array.isArray(data.blocks) ? data.blocks : []);
    return set;
  } catch {
    return new Set();
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
      // hero: coincide contra url(...) en bg
      if (b.type === 'hero' && b.data && typeof b.data.bg === 'string') {
        const m = b.data.bg.match(/url\(([^)]+)\)/i);
        if (m && m[1]) {
          const raw = m[1].replace(/['"]/g, '');
          if (raw === url) return true;
        }
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

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: 'Falta id' }, { status: 400 });

    // Obtener la página antes de eliminarla para conocer sus imágenes
    let pageBefore = null;
    try {
      pageBefore = await getPageById(id);
    } catch {}

    const result = await deletePageById(id);
    if (!result.ok) return NextResponse.json({ ok: false, error: 'No encontrada' }, { status: 404 });

    // Intentar borrar imágenes que eran exclusivas de esta página
    let imagesDeleted = 0;
    if (pageBefore) {
      try {
        const urls = Array.from(collectImageUrls(pageBefore));
        if (urls.length) {
          const pages = await getAllPagesWithData(); // ya no incluye la borrada
          const toDelete = urls.filter((u) => !isUrlReferencedInAnyPage(u, pages));
          if (toDelete.length) {
            const outs = await Promise.allSettled(toDelete.map(u => deleteImage(u)));
            imagesDeleted = outs.filter(o => o.status === 'fulfilled' && o.value === true).length;
          }
        }
      } catch (e) {
        console.warn('[DELETE /api/editor] limpieza de imágenes falló', e);
      }
    }

    return NextResponse.json({ ok: true, message: 'Página eliminada', imagesDeleted }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar página:', error);
    return NextResponse.json({ ok: false, error: 'Error al eliminar página' }, { status: 500 });
  }
}