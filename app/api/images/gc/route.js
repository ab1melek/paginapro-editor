import { NextResponse } from 'next/server';

// Endpoint de GC deshabilitado deliberadamente.
// Mantener el archivo evita rutas huérfanas en importadores, pero no expone funcionalidad.
export async function POST() {
  return NextResponse.json({ error: 'GC deshabilitado' }, { status: 410 });
}
