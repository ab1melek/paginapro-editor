// Server-side renderer for Editor.js data
// This file is safe for SSR and will be used by published pages for SEO.

import { calcWeights, getNonEmptyColumns, makeContainerClass, normalize } from './utils/editorRender';

export default function EditorRenderServer({ data }) {
  const { blocks } = normalize(data);

  if (!blocks.length) return <p style={{ opacity: 0.7 }}>Sin contenido</p>;

  const renderBlock = (block) => {
    if (!block) return null;
    const rawAlign = block.tunes?.alignment?.alignment;
    const align = block.type === "image"
      ? (rawAlign || "center")
      : (rawAlign || "left");

    switch (block.type) {
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
        return (
          <div key={block.id} style={{ textAlign: d.align || 'left', margin: '0 0 1rem' }}>
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

        return (
          <div key={block.id} className={containerClass} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start', margin: '1rem 0' }}>
            {/* Scoped style to force stacking on small screens for published pages (SEO-safe) */}
            <style>{`@media (max-width:480px) { .${containerClass} > .editor-column { flex: 0 0 100% !important; max-width: 100% !important; } }`}</style>
            {nonEmptyColumns.map((colBlocks, idx) => (
              <div
                key={idx}
                className="editor-column"
                style={{
                  flex: `${weights[idx]} 1 0`,
                  maxWidth: `${(weights[idx]/total)*100}%`,
                  minWidth: nonEmptyColumns.length === 4 ? 160 : 220,
                  display: "flex",
                  flexDirection: "column",
                  gap: ".5rem"
                }}
              >
                {(colBlocks || []).map(inner => renderBlock(inner))}
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

  return (
    <div>
      {blocks.map(renderBlock)}
    </div>
  );
}
