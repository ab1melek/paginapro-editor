import ReadOnlyPage from "../../components/ReadOnlyPage";
import config from "../config";

export default async function PaginaPorSlug({ params }) {
  // Await params antes de destructurar
  const { slug } = await params;
  const res = await fetch(`${config.baseURL}/api/editor?slug=${slug}`, { cache: "no-store" });
  if (!res.ok) return <ReadOnlyPage pageData={null} />;
  const pageData = await res.json();
  return <ReadOnlyPage pageData={pageData} />;
}