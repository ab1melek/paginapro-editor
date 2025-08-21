import { NextResponse } from "next/server";
import { saveEditorData } from "../services/editor.service.js";

export async function POST(req) {
    try {
        const data = await req.json(); // Usar await para obtener los datos correctamente
        console.log("Datos recibidos en el router:", data);
        const result = await saveEditorData(data); // Pasar los datos al servicio
        return NextResponse.json(result, { status: 201 });
    } catch (error){
        console.error("Error al procesar la solicitud:", error);
        return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
    }
};