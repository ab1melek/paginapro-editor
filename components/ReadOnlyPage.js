import EditorRenderServer from "./EditorRender.server";

export default function ReadOnlyPage({ pageData }) {
  if (!pageData) return <div>Página no encontrada</div>;
  return (
    <main style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <EditorRenderServer data={pageData} />
    </main>
  );
}