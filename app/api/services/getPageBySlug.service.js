import fs from "fs";
import path from "path";

// Devuelve el primer objeto cuya propiedad slug coincida (case-insensitive)
export const getPageBySlug = async (slug) => {
  const folderPath = path.join(process.cwd(), "JSON");
  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(folderPath, file), "utf-8"));
    if (data[0]?.slug?.toLowerCase() === slug.toLowerCase()) {
      return data[0];
    }
  }
  return null;
};