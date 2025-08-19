// app/editor/page.js
"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("../components/Editor.js"), {
  ssr: false,
});

export default function EditorPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Mi Editor 🚀</h1>
      <div style={{ width: '100%', height: '800px' }}>
        <Editor />
      </div>
    </main>
  );
}
