"use client";

// Render sin depender de editorjs-react-renderer para asegurar alineaciones
import { useEffect } from 'react';
import SocialIcons from './SocialIcons';
import { calcWeights, getMaxColumnsInBlocks, getNonEmptyColumns, makeContainerClass, normalize } from './utils/editorRender';

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
      case "hero": {
        const d = block.data || {};
        const o = (hex, a=1) => {
          if (!hex) return '';
          const h = hex.replace('#','');
          const V = h.length===3 ? h.split('').map(c=>c+c).join('') : h;
          const x = parseInt(V,16); const r=(x>>16)&255, g=(x>>8)&255, b=x&255;
          return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
        };
        const base = d.bg || 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,1))';
        const heroBgLocal = d.overlayColor && (typeof d.overlayOpacity === 'number') && d.overlayOpacity>0
          ? `linear-gradient(${o(d.overlayColor, d.overlayOpacity)}, ${o(d.overlayColor, d.overlayOpacity)}), ${base}`
          : base;
        return (
          <section key={block.id} className="landing-hero" style={{ background: heroBgLocal, textAlign: d.align || 'center', paddingTop: (d.paddingTop||72), paddingBottom: (d.paddingBottom||48) }}>
            {(Array.isArray(d.blocks) ? d.blocks : []).map(inner => renderBlock(inner, false))}
          </section>
        );
      }
      case "pageSettings": {
        // Bloque de control visual, no se renderiza como contenido
        return null;
      }
      case "socialIcons": {
        const d = block.data || {};
        return <SocialIcons key={block.id} data={d} />;
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
  const cols = nonEmptyColumns.length;
  const gapPx = 16; // mantener en sync con style.gap

        return (
          <div
            key={block.id}
            className={containerClass}
            style={{
              display: "flex",
              gap: `${gapPx}px`,
              flexWrap: 'nowrap',
              alignItems: "stretch",
              margin: "1rem 0"
            }}
          >
            {/* Scoped style to force stacking on small screens */}
            <style>{`@media (max-width:480px) { .${containerClass} { flex-wrap: wrap !important; } .${containerClass} > .editor-column { flex: 0 0 100% !important; max-width: 100% !important; } }`}</style>
            {nonEmptyColumns.map((colBlocks, idx) => (
              <div
                key={idx}
                className="editor-column"
                style={{
                  flex: `0 0 calc(${(weights[idx]/total)*100}% - ${(gapPx * (cols - 1)) / cols}px)` ,
                  maxWidth: `calc(${(weights[idx]/total)*100}% - ${(gapPx * (cols - 1)) / cols}px)`,
                  minWidth: 0,
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

  const maxCols = getMaxColumnsInBlocks(blocks);
  const containerMax = maxCols >= 4
    ? Math.max(pageSettings?.maxWidth || 900, 900)
    : maxCols === 3
      ? Math.max(pageSettings?.maxWidth || 780, 780)
      : (pageSettings?.maxWidth || 700);

  const isLanding = pageSettings?.layout === 'landing';
  const themePrimary = pageSettings?.primaryColor || '#2563eb';
  const themeText = pageSettings?.textColor || '#0f172a';
  const heroBase = pageSettings?.heroBackground || pageSettings?.containerBackgroundColor || 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,1))';
  const overlayHex = pageSettings?.heroOverlayColor || '';
  const overlayOpacity = typeof pageSettings?.heroOverlayOpacity === 'number' ? pageSettings.heroOverlayOpacity : 0;
  const hexToRgba = (hex, a=1) => {
    if (!hex || typeof hex !== 'string') return '';
    const h = hex.replace('#','');
    const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
  };
  const heroBg = overlayHex && overlayOpacity > 0
    ? `linear-gradient(${hexToRgba(overlayHex, overlayOpacity)}, ${hexToRgba(overlayHex, overlayOpacity)}), ${heroBase}`
    : heroBase;

  return (
    <div className={isLanding ? 'landing-theme' : undefined}>
      {isLanding ? (
        <style>{`
          .landing-theme .editor-content-container {
            padding: 0 !important;
            max-width: ${containerMax}px;
          }
          .landing-hero {
            padding: 72px 24px 48px;
            background: ${heroBg};
            text-align: center;
          }
          .landing-hero h1 { font-size: 44px; line-height: 1.1; margin: 0 0 12px; letter-spacing: -0.02em; }
          .landing-hero p  { font-size: 18px; opacity: .85; margin: 0 0 18px; }
          .landing-cta {
            display: inline-block; background: ${themePrimary}; color: #fff; padding: 12px 22px; border-radius: 10px;
            box-shadow: 0 8px 24px rgba(37,99,235,0.25); transition: transform .12s ease, box-shadow .12s ease;
          }
          .landing-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(37,99,235,0.32); }
          .landing-section { padding: 40px 24px; }
          .landing-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
          .landing-card { background: #fff; border: 1px solid #eef2f7; border-radius: 12px; padding: 18px; box-shadow: 0 4px 14px rgba(20,24,38,0.04); }
          .landing-card h3 { margin: 0 0 8px; }
          .landing-theme h1, .landing-theme h2, .landing-theme h3, .landing-theme p { color: ${themeText}; }
        `}</style>
      ) : null}
      <div
        className="editor-content-container"
        style={{ padding: 32, maxWidth: containerMax, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}
      >
        {blocks.map((b, i) => {
          // Si existe un bloque hero explícito, renderízalo tal cual
          if (b.type === 'hero') return renderBlock(b, false);
          if (!isLanding) return renderBlock(b, false);
          // Heurística suave: primer header/paragraph/button forman el hero si aparecen al inicio
          if (i === 0 && b.type === 'header') {
            const next = blocks[i+1];
            const next2 = blocks[i+2];
            if (next?.type === 'paragraph' && (next2?.type === 'button')) {
              return (
                <section key={`hero-${b.id}`} className="landing-hero">
                  {renderBlock(b)}
                  {renderBlock(next)}
                  {/* Button con override de clase CTA */}
                  <div style={{ marginTop: 8 }}>
                    <a href={next2?.data?.link || '#'} className="landing-cta">{next2?.data?.text || 'Empezar'}</a>
                  </div>
                </section>
              );
            }
          }
          // Si es una sección de columnas de 3, render como cards
          if (b.type === 'columns') {
            const nested = b.data?.blocks;
            if (Array.isArray(nested) && nested.length === 3) {
              return (
                <section key={`cards-${b.id}`} className="landing-section">
                  <div className="landing-cards">
                    {nested.map((col, idx) => (
                      <div key={idx} className="landing-card">
                        {(Array.isArray(col) ? col : (col?.blocks || [])).map(inner => renderBlock(inner))}
                      </div>
                    ))}
                  </div>
                </section>
              );
            }
          }
          // Fallback: render normal
          return renderBlock(b, false);
        })}
      </div>
    </div>
  );
}