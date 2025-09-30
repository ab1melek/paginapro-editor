import EditorRenderServer from "./EditorRender.server";
import LandingRenderer from "./LandingRenderer";
import { normalize } from "./utils/editorRender";

export default function ReadOnlyPage({ pageData }) {
  if (!pageData) return <div>Página no encontrada</div>;
  
  // Detectar si es una landing page para usar el renderer apropiado
  const { pageSettings } = normalize(pageData);
  const isLanding = pageSettings?.layout === 'landing';
  
  // Aplicar estilos de página (backgroundColor, etc.)
  const pageStyle = {
    ...(pageSettings?.pageBackgroundColor && { backgroundColor: pageSettings.pageBackgroundColor }),
    minHeight: '100vh'
  };
  
  return (
    <main style={pageStyle}>
      {isLanding ? (
        <LandingRenderer data={pageData} />
      ) : (
        <EditorRenderServer data={pageData} />
      )}
    </main>
  );
}