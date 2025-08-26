import fs from "fs";
import path from "path";

// Lee una página por ID (nombre de archivo sin extensión) y devuelve el primer objeto guardado
export const getPageById = async (id) => {
	try {
		const filePath = path.join(process.cwd(), "JSON", `${id}.json`);
		if (!fs.existsSync(filePath)) {
			throw new Error("La página no existe");
		}
		const fileContent = fs.readFileSync(filePath, "utf-8");
		const data = JSON.parse(fileContent);
		const pageObject = Array.isArray(data) ? data[0] : data;
		return pageObject; // Estructura que necesita el editor (time, blocks, version, slug, id, etc.)
	} catch (error) {
		console.error("Error al leer la página por ID:", error);
		throw new Error("Error al leer la página");
	}
};

// Boilerplate para futura edición (no usado aún) manteniendo compatibilidad
export const editPageById = async (id, newData) => {
	try {
		const filePath = path.join(process.cwd(), "JSON", `${id}.json`);
		if (!fs.existsSync(filePath)) {
			throw new Error("La página no existe");
		}
		// Leer datos existentes
		const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
		const base = Array.isArray(existing) ? existing[0] : existing;
		const merged = { ...base, ...newData };
		fs.writeFileSync(filePath, JSON.stringify([merged], null, 2));
		return { message: "Página actualizada", data: merged };
	} catch (error) {
		console.error("Error al editar la página:", error);
		throw new Error("Error al editar la página");
	}
};
