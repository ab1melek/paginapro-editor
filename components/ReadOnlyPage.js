import EditorRenderServer from "./EditorRender.server";

export default function ReadOnlyPage({ pageData }) {
  if (!pageData) return <div>Página no encontrada</div>;
  // El centering y padding los maneja EditorRenderServer (.editor-content-container)
  return (
    <main>
      <EditorRenderServer data={pageData} />
    </main>
  );
}