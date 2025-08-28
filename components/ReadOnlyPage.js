"use client";
import dynamic from "next/dynamic";

const EditorRender = dynamic(() => import("./EditorRender"), { ssr: false });

export default function ReadOnlyPage({ pageData }) {
  if (!pageData) return <div>Página no encontrada</div>;
  return (
    <main style={{ padding: 32, maxWidth: 700, margin: "0 auto" }}>
      <EditorRender data={pageData} />
    </main>
  );
}