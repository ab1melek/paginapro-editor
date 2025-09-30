import EditorRenderServer from "./EditorRender.server";
import LandingRenderer from "./LandingRenderer";
import MislinksRenderer from "./MislinksRenderer";
import { normalize } from "./utils/editorRender";

export default function ReadOnlyPage({ pageData }) {
  if (!pageData) return <div>Página no encontrada</div>;
  
  // Detectar si es una landing page para usar el renderer apropiado
  const { pageSettings } = normalize(pageData);
  const isLanding = pageSettings?.layout === 'landing';
  const isMislinks = pageSettings?.layout === 'mislinks';
  
  // Aplicar estilos de página (backgroundColor, etc.)
  const pageStyle = {
    // En mislinks, el fondo lo maneja el renderer (bg color/imagen)
    ...(pageSettings?.pageBackgroundColor && !isMislinks ? { backgroundColor: pageSettings.pageBackgroundColor } : {}),
    minHeight: '100vh',
  };
  
  return (
    <main style={pageStyle}>
      {isLanding ? (
        <LandingRenderer data={pageData} />
      ) : isMislinks ? (
        <MislinksRenderer data={pageData} />
      ) : (
        <EditorRenderServer data={pageData} />
      )}
    </main>
  );
}