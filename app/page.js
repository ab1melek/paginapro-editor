import ReadOnlyPage from "../components/ReadOnlyPage";
import { APP } from "../lib/config";
import { paginaproTemplate } from "./templates/paginapro";

export default async function HomePage() {
  // Slug que representa la portada del sitio; cámbialo con HOME_SLUG si lo deseas
  const HOME_SLUG = process.env.HOME_SLUG || 'paginaprolanding';
  const baseURL = APP?.baseURL || `http://localhost:${APP?.port || 3000}`;
  try {
    const res = await fetch(`${baseURL}/api/editor?slug=${encodeURIComponent(HOME_SLUG)}`, { cache: 'no-store' });
    if (res.ok) {
      const pageData = await res.json();
      return <ReadOnlyPage pageData={pageData} />;
    }
  } catch (e) {
    // Ignorar y usar fallback
  }
  // Fallback: si no existe aún la página con el slug, mostrar el template por defecto
  return <ReadOnlyPage pageData={paginaproTemplate} />;
}
