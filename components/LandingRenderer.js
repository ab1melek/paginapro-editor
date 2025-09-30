import { calcWeights, getMaxColumnsInBlocks, getNonEmptyColumns, normalize } from "./utils/editorRender";

export default function LandingRenderer({ data }) {
  try {
    const { blocks, pageSettings } = normalize(data);

    if (!blocks || !blocks.length) {
      return <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>Sin contenido</p>;
    }

  const renderBlock = (block, insideColumn = false, keyPrefix = '') => {
    if (!block) return null;
    const rawAlign = block.tunes?.alignment?.alignment;
    const align = block.type === "image"
      ? (rawAlign || "center")
      : (rawAlign || "left");
    
    const blockKey = block.id || keyPrefix || `block-${Math.random().toString(36).substr(2, 9)}`;

    switch (block.type) {
      case "hero": {
        const d = block.data || {};
        const o = (hex, a=1) => {
          try {
            if (!hex) return '';
            const h = hex.replace('#','');
            const v = h.length===3 ? h.split('').map(c=>c+c).join('') : h;
            const x = parseInt(v,16); const r=(x>>16)&255, g=(x>>8)&255, b=x&255;
            return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
          } catch { return ''; }
        };
        const base = d.bg || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        const heroBgLocal = d.overlayColor && (typeof d.overlayOpacity === 'number') && d.overlayOpacity>0
          ? `linear-gradient(${o(d.overlayColor, d.overlayOpacity)}, ${o(d.overlayColor, d.overlayOpacity)}), ${base}`
          : base;
        return (
          <section key={blockKey} className="pro-hero" style={{ 
            background: heroBgLocal, 
            textAlign: d.align || 'center', 
            paddingTop: (d.paddingTop||100), 
            paddingBottom: (d.paddingBottom||80),
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div className="pro-hero-content">
              {(Array.isArray(d.blocks) ? d.blocks : []).map((inner, index) => renderBlock(inner, false, `hero-${index}`))}
            </div>
          </section>
        );
      }
      case "header": {
        const level = block.data?.level || 1;
        const text = block.data?.text || "";
        const Tag = `h${level}`;
        const className = insideColumn ? "pro-header-column" : `pro-header pro-header-${level}`;
        return (
          <Tag key={blockKey} className={className} style={{ textAlign: align }}>
            {text}
          </Tag>
        );
      }
      case "paragraph": {
        const text = block.data?.text || "";
        const className = insideColumn ? "pro-paragraph-column" : "pro-paragraph";
        return (
          <p key={blockKey} className={className} style={{ textAlign: align }}>
            {text.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < text.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      }
      case "button": {
        const data = block.data || {};
        const bgColor = data.bgColor || '#3b82f6';
        const textColor = data.textColor || '#ffffff';
        const text = data.text || 'Button';
        const link = data.link || '#';
        
        return (
          <div key={blockKey} className="pro-button-container" style={{ textAlign: align }}>
            <a 
              href={link}
              className="pro-button"
              style={{
                backgroundColor: bgColor,
                color: textColor,
              }}
            >
              {text}
            </a>
          </div>
        );
      }
      case "image": {
        const data = block.data || {};
        const url = data.file?.url || data.url;
        const caption = data.caption || "";
        const stretched = data.stretched || false;
        const withBorder = data.withBorder || false;
        const withBackground = data.withBackground || false;
        
        if (!url) return null;
        
        return (
          <figure key={blockKey} className="pro-image" style={{ textAlign: align }}>
            <img 
              src={url} 
              alt={caption || ""}
              className={`pro-image-img ${stretched ? 'stretched' : ''} ${withBorder ? 'with-border' : ''} ${withBackground ? 'with-background' : ''}`}
            />
            {caption && <figcaption className="pro-image-caption">{caption}</figcaption>}
          </figure>
        );
      }
      case "quote": {
        const text = block.data?.text || "";
        const caption = block.data?.caption || "";
        return (
          <blockquote key={blockKey} className="pro-quote" style={{ textAlign: align }}>
            <div className="pro-quote-text">"{text}"</div>
            {caption && <cite className="pro-quote-caption">— {caption}</cite>}
          </blockquote>
        );
      }
      case "list": {
        const items = block.data?.items || [];
        const style = block.data?.style || "unordered";
        const Tag = style === "ordered" ? "ol" : "ul";
        return (
          <Tag key={blockKey} className="pro-list" style={{ textAlign: align }}>
            {items.map((item, i) => (
              <li key={i} className="pro-list-item">{item}</li>
            ))}
          </Tag>
        );
      }
      case "columns": {
        const d = block.data || {};
        const cols = getNonEmptyColumns(d.blocks || []);
        if (!cols.length) return null;
        const weights = calcWeights(d.ratio, cols.length);
        
        let columnClass = "pro-columns";
        if (cols.length === 4) columnClass += " four-columns";
        else if (cols.length === 3) columnClass += " three-columns";
        else if (cols.length === 2) columnClass += " two-columns";
        
        return (
          <div key={blockKey} className={columnClass}>
            {cols.map((col, i) => (
              <div key={`${blockKey}-col-${i}`} className="pro-column" style={{ flex: weights[i] || 1 }}>
                {(Array.isArray(col) ? col : []).map((inner, innerIndex) => renderBlock(inner, true, `${blockKey}-col-${i}-${innerIndex}`))}
              </div>
            ))}
          </div>
        );
      }
      default:
        return (
          <pre key={blockKey} style={{
            background: "#f5f5f5",
            padding: 12,
            fontSize: 12,
            overflowX: "auto",
            borderRadius: 4,
            margin: "0 0 1rem"
          }}>
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
      css += `.pro-container{background-color:${pageSettings.containerBackgroundColor};}`;
    }
    return css;
  };

  const maxCols = getMaxColumnsInBlocks(blocks);
  const containerMax = maxCols >= 4
    ? Math.max(pageSettings?.maxWidth || 1200, 1200)
    : maxCols === 3
      ? Math.max(pageSettings?.maxWidth || 1000, 1000)
      : (pageSettings?.maxWidth || 1200);

  const isLanding = pageSettings?.layout === 'landing';
  const themePrimary = pageSettings?.primaryColor || '#3b82f6';
  const themeAccent = pageSettings?.accentColor || '#10b981';
  const themeText = pageSettings?.textColor || '#1e293b';

  // Estilos avanzados para landing profesional
  const proStyles = `
    .pro-container {
      padding: 0 !important;
      max-width: ${containerMax}px;
      margin: 0 auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${themeText};
    }

    .pro-hero {
      position: relative;
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-attachment: fixed;
    }

    .pro-hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);
      pointer-events: none;
    }

    .pro-hero-content {
      position: relative;
      z-index: 2;
      max-width: 800px;
      padding: 0 24px;
    }

    .pro-header {
      margin: 0 0 1.5rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.2;
    }

    .pro-header-1 {
      font-size: clamp(2.5rem, 5vw, 4rem);
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 1rem;
    }

    .pro-header-2 {
      font-size: clamp(2rem, 4vw, 3rem);
      color: ${themeText};
      margin: 3rem 0 2rem;
    }

    .pro-header-3 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      color: ${themeText};
      margin: 2rem 0 1rem;
    }

    .pro-header-4 {
      font-size: clamp(1.25rem, 2.5vw, 1.5rem);
      color: ${themeText};
      margin: 1.5rem 0 0.75rem;
    }

    .pro-header-column {
      font-size: 1.5rem;
      font-weight: 600;
      color: ${themeText};
      margin: 0 0 0.75rem;
    }

    .pro-paragraph {
      font-size: clamp(1rem, 2vw, 1.25rem);
      color: rgba(255,255,255,0.9);
      margin: 0 0 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .pro-paragraph-column {
      font-size: 1rem;
      color: ${themeText};
      margin: 0 0 1.5rem;
      opacity: 0.8;
    }

    .pro-button-container {
      margin: 2rem 0;
    }

    .pro-button {
      display: inline-block;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
      transform: translateY(0);
    }

    .pro-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .pro-columns {
      display: grid;
      gap: 2rem;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      margin: 4rem 0;
      padding: 0 2rem;
    }

    .pro-columns.four-columns {
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }

    .pro-columns.three-columns {
      grid-template-columns: repeat(3, 1fr);
    }

    .pro-columns.two-columns {
      grid-template-columns: repeat(2, 1fr);
    }

    .pro-column {
      background: #ffffff;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }

    .pro-column:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .pro-quote {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-left: 4px solid ${themePrimary};
      border-radius: 12px;
      padding: 2rem;
      margin: 2rem 0;
      font-style: italic;
    }

    .pro-quote-text {
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 1rem;
      color: ${themeText};
    }

    .pro-quote-caption {
      font-size: 0.9rem;
      color: #64748b;
      font-weight: 600;
    }

    .pro-image {
      margin: 1.5rem 0;
    }

    .pro-image-img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      display: block;
    }

    .pro-image-img.stretched {
      width: 100%;
    }

    .pro-image-img.with-border {
      border: 1px solid #e5e7eb;
      padding: 4px;
    }

    .pro-image-img.with-background {
      background-color: #f9fafb;
      padding: 12px;
    }

    .pro-image-caption {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.5rem;
      font-style: italic;
    }

    .pro-list {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    .pro-list-item {
      margin: 0.5rem 0;
      line-height: 1.6;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .pro-columns.four-columns {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .pro-columns,
      .pro-columns.four-columns,
      .pro-columns.three-columns,
      .pro-columns.two-columns {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        padding: 0 1rem;
        margin: 2rem 0;
      }

      .pro-column {
        padding: 1.5rem;
      }

      .pro-hero-content {
        padding: 0 1rem;
      }

      .pro-button {
        padding: 14px 28px;
        font-size: 1rem;
      }

      .pro-hero {
        min-height: 50vh;
        padding: 60px 20px 50px;
      }
    }

    @media (max-width: 480px) {
      .pro-column {
        padding: 1rem;
      }

      .pro-hero-content {
        padding: 0 0.5rem;
      }
    }

    /* Animaciones sutiles */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .pro-column {
      animation: fadeInUp 0.6s ease-out;
    }

    .pro-hero-content > * {
      animation: fadeInUp 0.8s ease-out;
    }
  `;

  return (
    <>
      {buildStyles() ? <style dangerouslySetInnerHTML={{ __html: buildStyles() }} /> : null}
      <style dangerouslySetInnerHTML={{ __html: proStyles }} />
      <div className="pro-container">
        {blocks.map((b, index) => renderBlock(b, false, `main-${index}`))}
      </div>
    </>
  );
  } catch (error) {
    console.error('Error rendering landing page:', error);
    return <p style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>Error al renderizar la página</p>;
  }
}