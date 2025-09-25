import { NextResponse } from "next/server";
import { createPage } from "../services/createPage.db.service";
import { editPageById, getPageById } from "../services/editPageById.db.service";
import { getPageBySlug } from "../services/getPageBySlug.db.service";
import { getPages } from "../services/getPages.db.services";

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
    // Garantizar que no se pierda el id
    const dataToUpdate = { ...body, id };
    const result = await editPageById(id, dataToUpdate);
    console.log("Página actualizada", id, result.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}