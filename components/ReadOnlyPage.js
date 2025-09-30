import EditorRenderServer from "./EditorRender.server";
import LandingRenderer from "./LandingRenderer";
import { normalize } from "./utils/editorRender";

export default function ReadOnlyPage({ pageData }) {
  if (!pageData) return <div>Página no encontrada</div>;
  
  // Detectar si es una landing page para usar el renderer apropiado
  const { pageSettings } = normalize(pageData);
  const isLanding = pageSettings?.layout === 'landing';
  
  return (
    <main>
      {isLanding ? (
        <LandingRenderer data={pageData} />
      ) : (
        <EditorRenderServer data={pageData} />
      )}
    </main>
  );
}