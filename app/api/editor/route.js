import { NextResponse } from "next/server";
import { createPage } from "../services/createPage.db.service";
import { editPageById, getPageById } from "../services/editPageById.db.service";
import { getAllPagesWithData } from "../services/getAllPagesWithData.db.service";
import { getPageBySlug } from "../services/getPageBySlug.db.service";
import { getPages } from "../services/getPages.db.services";
import { deleteImage } from "../services/images.services";

export async function POST(req) {
    try {
        const data = await req.json(); // Usar await para obtener los datos correctamente
        console.log("Datos recibidos en el router:", data);
        const result = await createPage(data);
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
  const page = await getPageBySlug(slug);
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
  }
  return NextResponse.json(page, { status: 200 });
    } else {
      // Obtener todas las páginas
      const result = await getPages();
      return NextResponse.json(result, { status: 200 });
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
    // Obtener versión previa para detectar imágenes a eliminar
    let prevPage = null;
    try {
      prevPage = await getPageById(id);
    } catch {}

    // Garantizar que no se pierda el id
    const dataToUpdate = { ...body, id };

    // Calcular conjunto de imágenes antes y después
    const prevUrls = collectImageUrls(prevPage);
    const nextUrls = collectImageUrls(dataToUpdate);
    const removed = Array.from(prevUrls).filter(u => !nextUrls.has(u));

    const result = await editPageById(id, dataToUpdate);
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