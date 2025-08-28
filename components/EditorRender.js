"use client";
import EditorJsRenderer from "editorjs-react-renderer";

export default function EditorReadOnly({ data }) {
  if (!data) return null;
  return <EditorJsRenderer data={data} />;
}