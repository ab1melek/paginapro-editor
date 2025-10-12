import { calcWeights, getMaxColumnsInBlocks, getNonEmptyColumns, normalize } from "./utils/editorRender";

// Renderer para páginas de tipo "menu": estructura por secciones, títulos y listas de platillos/precios.
export default function MenuRenderer({ data }) {
  const { blocks, pageSettings } = normalize(data);
  if (!blocks || !blocks.length) {
    return <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>Sin contenido</p>;
  }

  const theme = {
  bg: pageSettings?.backgroundColor || '#faf7f2',
  containerBg: pageSettings?.containerBackgroundColor || '#ffffff',
    text: pageSettings?.textColor || '#f8fafc',
    accent: pageSettings?.accentColor || '#f59e0b',
    primary: pageSettings?.primaryColor || '#22c55e',
    maxWidth: pageSettings?.maxWidth || 1024
  };

  // Helpers para listas de menú: extraer nombre, descripción y precio de cadenas variadas
  const parseMenuItem = (val) => {
    const asString = () => {
      if (val == null) return '';
      if (typeof val === 'string' || typeof val === 'number') return String(val);
      if (Array.isArray(val)) return val.map(v => (typeof v === 'string' ? v : '')).join(' ');
      if (typeof val === 'object') return String(val.text || val.label || val.title || val.content || '');
      return '';
    };
    const raw = asString().trim();
  // Separar por posibles saltos de línea HTML para permitir títulos + descripción
  const partsByBr = raw.split(/<br\s*\/?>(?![^<]*>)/i).map(s => s.trim()).filter(Boolean);
  let stripped = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  // Detectar marcador de dotfill literal: .-. (cliente puede poner "Platillo .-. $50" o solo ".-." para forzar puntos)
  const dotfillMarker = /\.-\./;
  const hasDotfillMarker = dotfillMarker.test(raw);
  // Detectar precio al final (con o sin símbolo)
    const priceMatch = stripped.match(/(?:\$\s*)?\d+(?:[.,]\d{1,2})?\s*(?:MXN|USD|EUR|€)?$/i);
    const price = priceMatch ? priceMatch[0].trim() : null;
    let left = price ? stripped.slice(0, stripped.lastIndexOf(price)).trim() : stripped;
    left = left.replace(/\.{2,}|·{2,}|-{2,}$/g, '').trim();
    // Determinar label/desc: preferir salto de línea (<br>) si existe
    let label = '';
    let desc = '';
    if (partsByBr.length >= 2) {
      label = partsByBr[0];
      desc = partsByBr.slice(1).join(' ');
      // remover el precio del label si quedó ahí
      if (price) label = label.replace(price, '').trim();
    } else {
      // Separar por guiones si no hay <br>
      const descSplit = left.split(/\s[-–—]\s|\s--\s/);
      label = (descSplit[0] || '').trim();
      desc = descSplit.length > 1 ? descSplit.slice(1).join(' - ').trim() : '';
    }
    // Badges simples entre corchetes: [nuevo], [popular], [recomendado]
    let badge = null;
    const badgeMatch = label.match(/\[(nuevo|novedad|popular|recomendado|especial)\]/i);
    const cleanLabel = label.replace(/\[(nuevo|novedad|popular|recomendado|especial)\]/ig, '').trim();
    if (badgeMatch) badge = badgeMatch[1].toLowerCase();
    return { raw, label: cleanLabel, desc, price, badge, dotfill: hasDotfillMarker };
  };

  const renderBlock = (block, keyPrefix = '') => {
    if (!block) return null;
    const key = block.id || keyPrefix;
    const align = block.tunes?.alignment?.alignment || 'left';
    const isFirst = typeof keyPrefix === 'string' && keyPrefix.startsWith('b-0');
    switch (block.type) {
      case 'banner':
      case 'hero': {
        // Banner estilo hero compacto para menús
        const d = block.data || {};
        const base = d.bg || (d.imageUrl ? `url(${d.imageUrl})` : `${theme.containerBg}`);
        const o = (hex, a=1) => {
          try { const h=hex?.replace('#',''); if(!h) return ''; const v=h.length===3?h.split('').map(c=>c+c).join(''):h; const x=parseInt(v,16); const r=(x>>16)&255,g=(x>>8)&255,b=x&255; return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`; } catch { return ''; }
        };
        const bannerBg = d.overlayColor && typeof d.overlayOpacity==='number' && d.overlayOpacity>0
          ? `linear-gradient(${o(d.overlayColor, d.overlayOpacity)}, ${o(d.overlayColor, d.overlayOpacity)}), ${base}`
          : base;
        const innerBlocks = Array.isArray(d.blocks) ? d.blocks : [];
        return (
          <section key={key} className="mn-banner" style={{ background: bannerBg, textAlign: d.align || 'center' }}>
            <div className="mn-banner-inner">
              {innerBlocks.slice(0,3).map((b, i) => (
                b.type === 'header' ? (
                  <h2 key={i} className={`mn-banner-h${b.data?.level || 2}`} dangerouslySetInnerHTML={{ __html: b.data?.text || '' }} />
                ) : b.type === 'paragraph' ? (
                  <p key={i} className="mn-banner-p" dangerouslySetInnerHTML={{ __html: (b.data?.text || '').replace(/\n/g,'<br>') }} />
                ) : null
              ))}
            </div>
          </section>
        );
      }
      case 'header': {
        const level = block.data?.level || 2;
        const text = block.data?.text || '';
        const Tag = `h${level}`;
        const cls = level === 1 ? 'mn-title' : 'mn-section-title';
        return <Tag key={key} className={cls} style={{ textAlign: level===1?'center':align }} dangerouslySetInnerHTML={{ __html: text }} />;
      }
      case 'paragraph': {
        const text = (block.data?.text || '').replace(/\n/g, '<br>');
        return <p key={key} className="mn-paragraph" style={{ textAlign: align }} dangerouslySetInnerHTML={{ __html: text }} />;
      }
      case 'list': {
        const items = block.data?.items || [];
        return (
          <ul key={key} className="mn-list" style={{ textAlign: align }}>
            {items.map((item, i) => {
              const it = parseMenuItem(item);
              return (
                <li key={i} className={`mn-item${it.price ? ' priced' : ''}`}>
                  <div className="mn-name">
                    <span className="mn-title" dangerouslySetInnerHTML={{ __html: it.label }} />
                    {it.badge ? <span className={`mn-badge ${it.badge}`}>{it.badge}</span> : null}
                    {it.desc ? <small className="mn-desc" dangerouslySetInnerHTML={{ __html: it.desc }} /> : null}
                  </div>
                  {(it.price || it.dotfill) ? <div className="mn-dotfill" aria-hidden="true" /> : null}
                  {it.price ? <div className="mn-price" dangerouslySetInnerHTML={{ __html: it.price }} /> : null}
                </li>
              );
            })}
          </ul>
        );
      }
      case 'image': {
        const url = block.data?.file?.url || block.data?.url;
        const caption = block.data?.caption || '';
        if (!url) return null;
        // Si la imagen está en el primer bloque, tratarla como logo pequeño
        const cls = isFirst ? 'mn-image mn-logo' : 'mn-image';
        return (
          <figure key={key} className={cls} style={{ textAlign: align }}>
            <img src={url} alt={caption || ''} />
            {caption ? <figcaption>{caption}</figcaption> : null}
          </figure>
        );
      }
      case 'columns': {
        const d = block.data || {};
        const cols = getNonEmptyColumns(d.blocks || []);
        if (!cols.length) return null;
        // Compatibilidad con util calcWeights(block, nonEmptyColumns)
        const { weights } = calcWeights({ data: { ratio: d.ratio } }, cols);
        let cls = 'mn-columns';
        if (cols.length === 4) cls += ' four';
        else if (cols.length === 3) cls += ' three';
        else if (cols.length === 2) cls += ' two';
        return (
          <div key={key} className={cls}>
            {cols.map((col, i) => (
              <div key={`${key}-c-${i}`} className="mn-col">
                {(Array.isArray(col) ? col : []).map((inner, j) => renderBlock(inner, `${key}-c-${i}-${j}`))}
              </div>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  // CSS del menú inspirado en los ejemplos: tipografía clara, títulos con acento, líneas punteadas para precios.
  const maxCols = getMaxColumnsInBlocks(blocks);
  const containerMax = maxCols >= 4 ? Math.max(theme.maxWidth, 1200) : (maxCols === 3 ? Math.max(theme.maxWidth, 1000) : theme.maxWidth);
  const css = `
    :root { --page-text-color: ${pageSettings?.textColor || theme.text}; }
    .menu-wrapper {
      background: radial-gradient(1200px 500px at 10% -10%, rgba(255,255,255,.06), transparent), ${theme.bg};
      min-height: 100vh; padding: 32px;
    }
    .menu-container {
      max-width: ${containerMax}px; margin: 0 auto; color: var(--page-text-color);
      background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)), ${theme.containerBg};
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 16px; padding: 32px;
      box-shadow: 0 12px 40px rgba(0,0,0,.35);
    }
    .mn-title {
      margin: 0 0 6px; letter-spacing: .01em; text-align: center;
      text-shadow: 0 2px 10px rgba(0,0,0,.06);
    }
    /* Banner superior tipo hero compacto */
    .mn-banner {
      position: relative;
      min-height: 180px;
      border-radius: 16px;
      margin-bottom: 18px;
      background-size: cover; background-position: center; background-repeat: no-repeat;
      display: grid; place-items: center;
      overflow: hidden;
    }
    .mn-banner-inner { padding: 22px; max-width: 820px; width: 100%; }
    .mn-banner-h1, .mn-banner-h2, .mn-banner-h3 { margin: 0 0 6px; letter-spacing: .02em; }
    .mn-banner-h1 { font-size: clamp(1.8rem, 4.5vw, 2.4rem); font-weight: 800; }
    .mn-banner-h2 { font-size: clamp(1.4rem, 3.5vw, 1.8rem); font-weight: 700; }
    .mn-banner-h3 { font-size: clamp(1.2rem, 3vw, 1.5rem); font-weight: 700; }
    .mn-banner-p { opacity: .9; margin: 4px 0 0; }
    /* Usar la variable CSS como valor por defecto, pero no forzarla con !important
       para permitir que el editor (inline styles / preview) sobrescriba el color.
       Si quieres anular una regla específica en el futuro podemos añadir un
       override más dirigido y opcional. */
    .menu-wrapper {
      /* --page-text-color ya definido en :root arriba */
    }
    .mn-paragraph { opacity: .9; text-align: center; margin: 0 0 24px; }
    .mn-section-title {
      margin: 28px 0 10px; color: inherit;
      position: relative; text-transform: uppercase; letter-spacing: .06em;
    }
    /* Removed accent bar (::after) to avoid orange lines in the design. */
  .mn-list { list-style: none; padding: 0; margin: 10px 0 18px; }
  .mn-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; }
  .mn-item.priced { border-bottom: 1px dashed rgba(0,0,0,0.08); border-color: currentColor; }
  .mn-name { display: flex; flex-direction: column; min-width: 0; max-width: 100%; }
  .mn-title { font-weight: 700; }
  .mn-desc { opacity: .75; font-size: 0.95rem; margin-top: 6px; }
    .mn-badge { display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 999px; font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; background: ${theme.primary}; color: #0b0f19; font-weight: 800; }
    .mn-badge.popular { background: ${theme.accent}; color: #0b0f19; }
    .mn-badge.recomendado, .mn-badge.especial { background: #22d3ee; color: #0b0f19; }
  .mn-dotfill { flex: 1; border-bottom: 1px dashed currentColor; transform: translateY(-2px); opacity: .6; }
  .mn-price { font-weight: 800; color: inherit; }
    .mn-image { margin: 8px 0 12px; }
    .mn-image img { display: block; width: 100%; height: auto; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,.3); }
    .mn-image figcaption { text-align: center; font-size: .9rem; opacity: .8; margin-top: 6px; }
  /* Logo pequeño cuando la imagen es el primer bloque */
  .mn-logo { display: flex; justify-content: center; }
  .mn-logo img { width: 140px; height: auto; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
  .mn-logo + .mn-title { margin-top: 8px; }
  .mn-columns { display: grid; gap: 20px; grid-template-columns: repeat(2, 1fr); margin: 10px 0; }
    .mn-columns.two { grid-template-columns: repeat(2, 1fr); }
    .mn-columns.three { grid-template-columns: repeat(3, 1fr); }
    .mn-columns.four { grid-template-columns: repeat(4, 1fr); }
    .mn-col { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,.25); }
    .mn-col:hover { box-shadow: 0 6px 22px rgba(0,0,0,.35); transform: translateY(-1px); transition: all .2s ease; }
    @media (max-width: 1000px) { .mn-columns.three, .mn-columns.four { grid-template-columns: repeat(2, 1fr); } }
    /* Mobile: mostrar listas en 2 columnas para estilo de carta de menú compacto */
    @media (max-width: 700px) {
      .menu-wrapper { padding: 16px; }
      .menu-container { padding: 20px; border-radius: 12px; }
      .mn-columns, .mn-columns.two, .mn-columns.three, .mn-columns.four { grid-template-columns: 1fr; }
      /* Convertir cada lista a grid de dos columnas */
      .mn-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 28px;
        margin: 8px 0 16px;
      }
      /* Cada item ocupará una celda; dentro del item usamos flex para alinear nombre y precio */
      .mn-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: none; }
      .mn-item.priced { border-bottom: none; }
      .mn-name { max-width: calc(100% - 96px); }
      .mn-title { font-size: 1rem; }
      .mn-desc { font-size: .9rem; }
      .mn-dotfill { display: none; }
      .mn-price { margin-left: auto; font-weight: 800; color: inherit; }
    }
  `;

  // Agrupación simple: mostrar bloques como vienen. Los títulos de nivel 2 naturalmente separan secciones visualmente.
  return (
    <div className="menu-wrapper">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="menu-container">
        {blocks.map((b, i) => renderBlock(b, `b-${i}`))}
      </div>
    </div>
  );
}

