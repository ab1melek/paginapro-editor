"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { hasFourColumnsInBlocks, normalize } from './utils/editorRender';

const EditorRender = dynamic(() => import("./EditorRender"), { ssr: false });

const DEVICES = {
  desktop: { label: "Desktop", width: 1200, height: 800, padding: 24 },
  tablet: { label: "Tablet", width: 768, height: 1024, padding: 20 },
  mobile: { label: "Mobile", width: 390, height: 844, padding: 16 }, // iPhone 12-ish
};

export default function PreviewGrid({ pageData }) {
  const [device, setDevice] = useState("desktop");
  const [orientation, setOrientation] = useState("portrait");
  const [customWidth, setCustomWidth] = useState("");

  const meta = DEVICES[device];
  const effective = useMemo(() => {
    let w = customWidth ? parseInt(customWidth, 10) : meta.width;
    if (!Number.isFinite(w) || w < 200) w = meta.width;
    const h = meta.height;
    return orientation === "portrait" ? { width: w, height: h } : { width: h, height: w };
  }, [meta, customWidth, orientation]);

  const frameStyle = {
    border: "1px solid #e9ecef", // color similar to editor column borders
    borderRadius: 8,
    background: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
    width: effective.width,
    minHeight: effective.height,
    overflowY: "auto",
    overflowX: "hidden",
    position: "relative",
    margin: "1rem 0",
  };

  // Detectar si hay 4 columnas para ajustar ancho en Desktop preview
  const { blocks } = normalize(pageData);
  const wantWide = hasFourColumnsInBlocks(blocks);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          padding: "10px 14px",
          border: "1px solid #e9ecef",
          borderRadius: 10,
          background: "#ffffff",
          boxShadow: "inset 0 -1px 0 #f1f1f1",
          fontSize: 13,
          position: 'relative' // allow absolute centering of device group
        }}
      >
        <div style={{ display: "flex", gap: 6, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          {/* Combined Desktop / Tablet button + Mobile */}
          <button
            key="desktop-tablet"
            onClick={() => setDevice((prev) => (prev === 'desktop' ? 'tablet' : 'desktop'))}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: (device === 'desktop' || device === 'tablet') ? "1px solid #295417" : "1px solid #ddd",
              background: (device === 'desktop' || device === 'tablet') ? "#295417" : "#fff",
              color: (device === 'desktop' || device === 'tablet') ? "#fff" : "#222",
              cursor: "pointer",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: (device === 'desktop' || device === 'tablet') ? 700 : 400,
              display: 'flex',
              gap: 8,
              alignItems: 'center'
            }}
          >
            <span>Desktop / Tablet</span>
            <small style={{ fontSize: 11, opacity: 0.9 }}>{device === 'desktop' ? 'Desktop' : 'Tablet'}</small>
          </button>

          <button
            key="mobile"
            onClick={() => setDevice('mobile')}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: device === 'mobile' ? "1px solid #295417" : "1px solid #ddd",
              background: device === 'mobile' ? "#295417" : "#fff",
              color: device === 'mobile' ? "#fff" : "#222",
              cursor: "pointer",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: device === 'mobile' ? 700 : 400,
            }}
          >
            Mobile
          </button>
        </div>
        {/* Orientation control - only relevant for mobile */}
        {device === 'mobile' && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
              style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  background: '#fff',
                  boxShadow: 'inset 0 -1px 0 #f1f1f1',
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 16,
                  color: '#222',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  cursor: 'pointer',
                  minWidth: 120,
                }}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        )}
        <div style={{ marginLeft: "auto", opacity: 0.75, fontSize: 13 }}>
          {meta.label} {device === 'mobile' ? (orientation === "portrait" ? "P" : "L") : ''} {device === 'mobile' ? '·' : ''} {device === 'mobile' ? effective.width + 'px' : ''}
        </div>
      </div>

      {/* Frame */}
      <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
        {/* If desktop, render a centered full-page container (mimic public page) */}
        {device === 'desktop' ? (
          // Render same layout as public ReadOnlyPage: centered main with padding 32 and maxWidth 700
          <main style={{ padding: 32, maxWidth: wantWide ? 900 : 700, margin: '0 auto', width: '100%' }}>
            <EditorRender data={pageData} device={device} />
          </main>
        ) : (
          <div style={{ width: effective.width + 2, boxSizing: 'content-box', maxWidth: '100%' }}>
            <div style={frameStyle}>
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  background: "#f5f5f5",
                  padding: "8px 14px",
                  borderBottom: "1px solid #eef0f2",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  zIndex: 2,
                }}
              >
                <span>{meta.label} viewport</span>
                <span style={{ opacity: 0.6 }}>{effective.width} × {effective.height}</span>
              </div>
              <div style={{ padding: meta.padding, maxWidth: '100%' }}>
                <EditorRender data={pageData} device={device} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
