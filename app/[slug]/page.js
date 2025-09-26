import ReadOnlyPage from "../../components/ReadOnlyPage";
import { APP } from '../../lib/config.js';

export default async function PaginaPorSlug({ params }) {
  // Await params antes de destructurar
  const { slug } = await params;
  const baseURL = APP?.baseURL || `http://localhost:${APP?.port || 3000}`;
  const res = await fetch(`${baseURL}/api/editor?slug=${slug}`, { cache: "no-store" });
  if (!res.ok) return <ReadOnlyPage pageData={null} />;
  const pageData = await res.json();
  return <ReadOnlyPage pageData={pageData} />;
}