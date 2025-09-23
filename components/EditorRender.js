"use client";

// Render sin depender de editorjs-react-renderer para asegurar alineaciones
import { useEffect } from 'react';
import { calcWeights, getNonEmptyColumns, hasFourColumnsInBlocks, makeContainerClass, normalize } from './utils/editorRender';

export default function EditorRender({ data, device }) {
  const { blocks, pageSettings } = normalize(data);

  // Aplicar estilos globales cuando existe pageSettings (sólo en cliente)
  useEffect(() => {
    if (!pageSettings) return;
    try {
      if (document?.body && pageSettings.backgroundColor) {
        document.body.style.backgroundColor = pageSettings.backgroundColor;
      }
      const mainContainer = document?.querySelector('.editor-content-container');
      if (mainContainer) {
        if (pageSettings.containerBackgroundColor) {
          mainContainer.style.backgroundColor = pageSettings.containerBackgroundColor;
        }
        if (typeof pageSettings.containerOpacity === 'number') {
          mainContainer.style.opacity = pageSettings.containerOpacity;
        }
      }
    } catch {}
    return () => {
      // limpiar estilos sólo del body para no interferir con otras vistas
      try { if (document?.body) document.body.style.backgroundColor = ''; } catch {}
    };
  }, [pageSettings?.backgroundColor, pageSettings?.containerBackgroundColor, pageSettings?.containerOpacity]);

  if (!blocks.length) return <p style={{ opacity:.7 }}>Sin contenido</p>;

  // Renderizador recursivo para soportar bloques anidados (e.g. columns)
  const renderBlock = (block, insideColumn = false) => {
    if (!block) return null;
    const rawAlign = block.tunes?.alignment?.alignment;
    const align = block.type === "image"
      ? (rawAlign || "center")
      : (rawAlign || "left");

    switch (block.type) {
      case "pageSettings": {
        // Bloque de control visual, no se renderiza como contenido
        return null;
      }
      case "button": {
        const d = block.data || {};
        const style = {
          background: d.bgColor || '#3490dc',
            color: d.textColor || '#fff',
            display: 'inline-block',
            padding: '10px 22px',
            borderRadius: 6,
            fontWeight:600,
            textDecoration:'none'
        };
        const wrapperStyle = { textAlign: d.align || 'left', margin: '0 0 1rem' };
        if (insideColumn) wrapperStyle.marginTop = 'auto';
        return (
          <div key={block.id} style={wrapperStyle}>
            <a href={d.link || '#'} style={style}>{d.text || 'Botón'}</a>
          </div>
        );
      }
      case "columns": {
        // El plugin realmente guarda los bloques anidados en data.blocks (array de arrays)
        // y data.columns es solo el número de columnas. Ejemplo:
        // data: { columns: 2, ratio: "1:1", blocks: [ [ {...}, {...} ], [ {...} ] ] }
        const nested = block.data?.blocks;
        if (!Array.isArray(nested)) return null;
        const nonEmptyColumns = getNonEmptyColumns(nested);
        if (!nonEmptyColumns.length) return null;

        // If preview requests mobile, stack columns vertically for faithful mobile rendering
        if (device === 'mobile') {
          return (
            <div key={block.id} style={{ display: 'block', margin: '1rem 0' }}>
              {nonEmptyColumns.map((colBlocks, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '.5rem',
                    marginBottom: '1rem',
                    background: block.tunes?.columnsStyle?.backgrounds?.[idx]?.color || 'transparent',
                    opacity: typeof block.tunes?.columnsStyle?.backgrounds?.[idx]?.opacity === 'number' ? block.tunes.columnsStyle.backgrounds[idx].opacity : undefined,
                    borderRadius: 4,
                    padding: block.tunes?.columnsStyle?.backgrounds?.[idx]?.color ? '8px' : undefined,
                  }}
                >
                  {(colBlocks || []).map(inner => renderBlock(inner, true))}
                </div>
              ))}
            </div>
          );
        }

        const { weights, total } = calcWeights(block, nonEmptyColumns);
        const containerClass = makeContainerClass(block.id);

        return (
          <div
            key={block.id}
            className={containerClass}
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: 'wrap',
              alignItems: "stretch",
              margin: "1rem 0"
            }}
          >
            {/* Scoped style to force stacking on small screens */}
            <style>{`@media (max-width:480px) { .${containerClass} > .editor-column { flex: 0 0 100% !important; max-width: 100% !important; } }`}</style>
            {nonEmptyColumns.map((colBlocks, idx) => (
              <div
                key={idx}
                className="editor-column"
                style={{
                  flex: `${weights[idx]} 1 0` ,
                  // Usar width flexible hasta 4 columnas; para tamaños pequeños permite wrap
                  maxWidth: `${(weights[idx]/total)*100}%`,
                  minWidth: nonEmptyColumns.length === 4 ? 170 : 220,
                  display: "flex",
                  flexDirection: "column",
                  gap: ".6rem",
                  background: block.tunes?.columnsStyle?.backgrounds?.[idx]?.color || 'transparent',
                  borderRadius: 6,
                  padding: block.tunes?.columnsStyle?.backgrounds?.[idx]?.color ? '10px' : undefined,
                }}
              >
                {(colBlocks || []).map(inner => renderBlock(inner, true))}
              </div>
            ))}
          </div>
        );
      }

      case "header": {
        const level = block.data?.level || 2;
        const Tag = `h${level}`;
        return (
          <Tag
            key={block.id}
            style={{ textAlign: align, margin:"1.2rem 0 .75rem" }}
            dangerouslySetInnerHTML={{ __html: block.data?.text || "" }}
          />
        );
      }

      case "paragraph":
        return (
          <p
            key={block.id}
            style={{ textAlign: align, margin:"0 0 1rem" }}
            dangerouslySetInnerHTML={{ __html: block.data?.text || "" }}
          />
        );

      case "image": {
        const d = block.data;
        if (!d?.file?.url) return null;

        const imgStyle = {
          display:"block",
          maxWidth: d.stretched ? "100%" : "100%",
          height:"auto",
          border: d.withBorder ? "1px solid #ccc" : "none",
          background: d.withBackground ? "#f5f5f5" : "transparent",
          borderRadius:4
        };

        if (align === "center") {
          imgStyle.margin = "0 auto";
        } else if (align === "right") {
          imgStyle.marginLeft = "auto";
          imgStyle.marginRight = 0;
        } else {
          imgStyle.margin = 0;
        }

        return (
          <figure key={block.id}
            style={{
              margin:"1.25rem 0",
              textAlign: align,
              display: align === "center" ? "flex" : "block",
              justifyContent: align === "center" ? "center" : "flex-start" }}>
            <img src={d.file.url} alt={d.caption || ""} style={imgStyle} />
            {d.caption && (
              <figcaption
                style={{
                  fontSize:12,
                  color:"#666",
                  marginTop:4,
                  textAlign: align
                }}
              >
                {d.caption}
              </figcaption>
            )}
          </figure>
        );
      }

      case "list": {
        const isOrdered = block.data?.style === "ordered";
        const items = block.data?.items || [];
        const ListTag = isOrdered ? "ol" : "ul";
        return (
          <ListTag
            key={block.id}
            style={{ textAlign: align, margin:"0 0 1rem", paddingLeft: isOrdered ? 28 : 22 }}
          >
            {items.map((it, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
            ))}
          </ListTag>
        );
      }

      case "quote": {
        const d = block.data;
        return (
          <blockquote
            key={block.id}
            style={{
              textAlign: align,
              borderLeft:"4px solid #2e5f3d",
              margin:"1rem 0",
              padding:"0.5rem 1rem",
              background:"#f7f9f8",
              fontStyle:"italic"
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: d?.text || "" }} />
            {d?.caption && (
              <cite style={{ display:"block", marginTop:6, fontSize:12, opacity:.7 }}>
                {d.caption}
              </cite>
            )}
          </blockquote>
        );
      }

      default:
        return (
          <pre
            key={block.id}
            style={{
              background:"#f4f4f4",
              padding:12,
              fontSize:12,
              overflowX:"auto",
              borderRadius:4,
              margin:"0 0 1rem"
            }}
          >
            {JSON.stringify(block, null, 2)}
          </pre>
        );
    }
  };

  const containerMax = hasFourColumnsInBlocks(blocks) ? Math.max(pageSettings?.maxWidth || 900, 900) : (pageSettings?.maxWidth || 700);

  return (
    <div
      className="editor-content-container"
      style={{ padding: 32, maxWidth: containerMax, margin: '0 auto' }}
    >
      {blocks.map(b => renderBlock(b, false))}
    </div>
  );
}