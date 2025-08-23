import { NextResponse } from "next/server";
import { createPage } from "../services/createPage.service";
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

export async function GET() {
    try {
        const result = await getPages(); //Trae las paginas del servicio
        return NextResponse.json(result, { status: 200 });
    } catch (error){
        console.error("Error al procesar la solicitud:", error);
        return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
    }
};