// app/editor/page.js
"use client";

import dynamic from "next/dynamic";

import styles from "./Editor.module.css";

const Editor = dynamic(() => import("../../../components/Editor.js"), {
  ssr: false,
});

export default function EditorPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Mi Editor 🚀</h1>
      <div className={styles.editorWrapper}>
        <Editor />
      </div>
    </main>
  );
}
