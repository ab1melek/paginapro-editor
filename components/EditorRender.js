"use client";

// Render sin depender de editorjs-react-renderer para asegurar alineaciones
function normalize(data) {
  if (!data) return { blocks: [] };
  if (data.blocks) return data;
  if (Array.isArray(data)) {
    const first = data[0];
    if (first?.blocks) return first;
  }
  return { blocks: [] };
}

export default function EditorRender({ data }) {
  const { blocks } = normalize(data);

  if (!blocks.length) return <p style={{ opacity:.7 }}>Sin contenido</p>;

  // Renderizador recursivo para soportar bloques anidados (e.g. columns)
  const renderBlock = (block) => {
    if (!block) return null;
    const rawAlign = block.tunes?.alignment?.alignment;
    const align = block.type === "image"
      ? (rawAlign || "center")
      : (rawAlign || "left");

    switch (block.type) {
      case "columns": {
        // El plugin realmente guarda los bloques anidados en data.blocks (array de arrays)
        // y data.columns es solo el número de columnas. Ejemplo:
        // data: { columns: 2, ratio: "1:1", blocks: [ [ {...}, {...} ], [ {...} ] ] }
        const nested = block.data?.blocks;
        if (!Array.isArray(nested)) return null;
        let nonEmptyColumns = nested
          .map(col => (Array.isArray(col) ? col : (col?.blocks || [])))
          .filter(arr => Array.isArray(arr) && arr.length);
        // Limitar sólo si excede 4, pero conservando 4 completas (fusionar extras en la última)
        if (nonEmptyColumns.length > 4) {
          const extra = nonEmptyColumns.slice(4).flat();
          nonEmptyColumns = nonEmptyColumns.slice(0,4);
          if (extra.length) {
            nonEmptyColumns[3] = [...nonEmptyColumns[3], ...extra];
          }
        }
        if (!nonEmptyColumns.length) return null;

        // Calcular pesos por ratio (ej: "2:1" => [2,1])
        let weights = [];
        if (typeof block.data?.ratio === 'string') {
          weights = block.data.ratio.split(':').map(n => {
            const v = parseFloat(n.trim());
            return Number.isFinite(v) && v > 0 ? v : 1;
          });
        }
        if (weights.length !== nonEmptyColumns.length) {
          // Ajustar longitud de pesos; extender o recortar según columnas
          if (weights.length > nonEmptyColumns.length) {
            weights = weights.slice(0, nonEmptyColumns.length);
          } else if (weights.length < nonEmptyColumns.length) {
            const diff = nonEmptyColumns.length - weights.length;
            weights = [...weights, ...new Array(diff).fill(1)];
          }
        }
        const total = weights.reduce((a,b)=>a+b,0) || 1;
        return (
          <div
            key={block.id}
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "flex-start",
              margin: "1rem 0"
            }}
          >
            {nonEmptyColumns.map((colBlocks, idx) => (
              <div
                key={idx}
                style={{
                  flex: `${weights[idx]} 1 0` ,
                  // Usar width flexible hasta 4 columnas; para tamaños pequeños permite wrap
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