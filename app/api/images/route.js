import { NextResponse } from "next/server";
import { saveImage } from "../services/images.services";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file) {
      return NextResponse.json({ success: 0, error: "No se proporcionó ninguna imagen" }, { status: 400 });
    }

    // Guardar la imagen usando el servicio
    const relativeUrl = await saveImage(file);

    // Construir la URL completa
    const baseUrl = `${req.headers.get("origin") || ""}`;
    const fullUrl = `${baseUrl}${relativeUrl}`;

    // Responder con el formato esperado por Editor.js
    return NextResponse.json({
      success: 1,
      file: {
        url: fullUrl
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error al subir la imagen:", error.message);
    return NextResponse.json({ success: 0, error: error.message }, { status: 400 });
  }
}