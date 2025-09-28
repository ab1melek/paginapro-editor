// Server-side renderer for Editor.js data
// This file is safe for SSR and will be used by published pages for SEO.

import { calcWeights, getMaxColumnsInBlocks, getNonEmptyColumns, makeContainerClass, normalize } from './utils/editorRender';

export default function EditorRenderServer({ data }) {
  const { blocks, pageSettings } = normalize(data);

  if (!blocks.length) return <p style={{ opacity: 0.7 }}>Sin contenido</p>;

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
        const nested = block.data?.blocks;
        if (!Array.isArray(nested)) return null;
        const nonEmptyColumns = getNonEmptyColumns(nested);
        if (!nonEmptyColumns.length) return null;

          const { weights, total } = calcWeights(block, nonEmptyColumns);
          const containerClass = makeContainerClass(block.id);
          const cols = nonEmptyColumns.length;
          const gapPx = 16; // mantener en sync con style.gap

          return (
            <div key={block.id} className={containerClass} style={{ display: 'flex', gap: `${gapPx}px`, flexWrap: 'nowrap', alignItems: 'stretch', margin: '1rem 0' }}>
            {/* Scoped style to force stacking on small screens for published pages (SEO-safe) */}
            <style>{`@media (max-width:480px) { .${containerClass} { flex-wrap: wrap !important; } .${containerClass} > .editor-column { flex: 0 0 100% !important; max-width: 100% !important; } }`}</style>
            {nonEmptyColumns.map((colBlocks, idx) => (
              <div
                key={idx}
                className="editor-column"
                style={{
                  flex: `0 0 calc(${(weights[idx]/total)*100}% - ${(gapPx * (cols - 1)) / cols}px)`,
                  maxWidth: `calc(${(weights[idx]/total)*100}% - ${(gapPx * (cols - 1)) / cols}px)`,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: ".6rem",
                  background: block.tunes?.columnsStyle?.backgrounds?.[idx]?.color || 'transparent',
                    opacity: typeof block.tunes?.columnsStyle?.backgrounds?.[idx]?.opacity === 'number' ? block.tunes.columnsStyle.backgrounds[idx].opacity : undefined,
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

  const buildStyles = () => {
    if (!pageSettings) return '';
    let css = '';
    if (pageSettings.backgroundColor) css += `body{background-color:${pageSettings.backgroundColor};}`;
    if (pageSettings.containerBackgroundColor) {
      css += `.editor-content-container{background-color:${pageSettings.containerBackgroundColor};}`;
    }
    return css;
  };

  const maxCols = getMaxColumnsInBlocks(blocks);
  const containerMax = maxCols >= 4
    ? Math.max(pageSettings?.maxWidth || 900, 900)
    : maxCols === 3
      ? Math.max(pageSettings?.maxWidth || 780, 780)
      : (pageSettings?.maxWidth || 700);

  return (
    <>
      {buildStyles() ? <style dangerouslySetInnerHTML={{ __html: buildStyles() }} /> : null}
      <div className="editor-content-container" style={{ padding: 32, maxWidth: containerMax, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {blocks.map(b => renderBlock(b, false))}
      </div>
    </>
  );
}
