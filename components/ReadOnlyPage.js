import EditorRenderServer from "./EditorRender.server";
import { hasFourColumnsInBlocks, normalize } from './utils/editorRender';

export default function ReadOnlyPage({ pageData }) {
  if (!pageData) return <div>Página no encontrada</div>;
  const { blocks, pageSettings } = normalize(pageData);
  const containerMax = hasFourColumnsInBlocks(blocks)
    ? Math.max(pageSettings?.maxWidth || 900, 900)
    : (pageSettings?.maxWidth || 700);
  return (
    <main style={{ padding: 32, maxWidth: containerMax, margin: '0 auto' }}>
      <EditorRenderServer data={pageData} />
    </main>
  );
}