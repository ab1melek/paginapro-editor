import PreviewLoader from "../../../../components/PreviewLoader";

export default function PreviewPage({ searchParams }) {
  const id = searchParams?.id;
  const previewKey = searchParams?.previewKey;

  if (!id && !previewKey) {
    return (
      <main style={{ padding: 32 }}>
        <h2>Parámetros faltantes</h2>
        <p>Pasa <code>?id=editor-...</code> o <code>?previewKey=...</code> en la URL.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Preview</h1>
      <PreviewLoader id={id} previewKey={previewKey} />
    </main>
  );
}