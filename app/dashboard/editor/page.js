"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("../../../components/Editor"), {
  ssr: false,
});

export default function EditorPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Mi Editor 🚀</h1>
      <Editor />
    </main>
  );
}
