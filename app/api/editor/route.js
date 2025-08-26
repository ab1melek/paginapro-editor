import { NextResponse } from "next/server";
import { createPage } from "../services/createPage.service";
import { getPageById } from "../services/editPageById.service";
import { getPages } from "../services/getPages.services";

export async function POST(req) {
    try {
        const data = await req.json(); // Usar await para obtener los datos correctamente
        console.log("Datos recibidos en el router:", data);
        const result = await createPage(data); // Pasar los datos al servicio
        return NextResponse.json(result, { status: 201 });
    } catch (error){
        console.error("Error al procesar la solicitud:", error);
        return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
    }
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      // Obtener una página específica
  const page = await getPageById(id);
  console.log("Página obtenida por ID", id, page); // <-- solo visualizar datos
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

export async function PUT() {
    try {
        const result = await editPageById(); //Edita una pagina por ID
        return NextResponse.json(result, { status: 200 });
    } catch (error){
        console.error("Error al procesar la solicitud:", error);
        return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
    }
}