"use client";

import dynamic from "next/dynamic";
import styles from "./Editor.module.css";

const Editor = dynamic(() => import("../../../components/Editor"), {
  ssr: false,
});

export default function EditorPage() {
  return (
    <main className={styles.main}>
      <h1>Mi Editor 🚀</h1>
      <Editor />
    </main>
  );
}
