import SocialIcons from "./SocialIcons";
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
    let align = block.type === "image"
      ? (rawAlign || "center")
      : (rawAlign || "left");
    
    // Para botones, usar la alineación interna si existe
    if (block.type === "button" && block.data?.align) {
      align = block.data.align;
    }
    
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
          <Tag 
            key={blockKey} 
            className={className} 
            style={{ textAlign: align }}
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
      }
      case "paragraph": {
        const text = block.data?.text || "";
        const className = insideColumn ? "pro-paragraph-column" : "pro-paragraph";
        // Convertir saltos de línea a <br> y usar dangerouslySetInnerHTML para HTML
        const htmlText = text.replace(/\n/g, '<br>');
        return (
          <p 
            key={blockKey} 
            className={className} 
            style={{ textAlign: align }}
            dangerouslySetInnerHTML={{ __html: htmlText }}
          />
        );
      }
      case "button": {
        const buttonText = block.data?.text || "Click aquí";
        const buttonLink = block.data?.link || "#";
        const style = block.data?.style || "primary";
        const backgroundColor = block.data?.bgColor || null;
        const textColor = block.data?.textColor || null;
        
        const baseClass = insideColumn ? "pro-button-column" : "pro-button";
        const className = `${baseClass} pro-button-${style}`;
        
        const buttonStyle = {
          ...(backgroundColor && { backgroundColor: backgroundColor, borderColor: backgroundColor }),
          ...(textColor && { color: textColor })
        };

        // Clase especial para botones con colores personalizados que necesitan hover
        const hasCustomColors = backgroundColor || textColor;
        const finalClassName = hasCustomColors ? `${className} pro-button-custom` : className;
        
        return (
          <div key={blockKey} className="pro-button-container" style={{ textAlign: align }}>
            <a
              href={buttonLink}
              className={finalClassName}
              style={buttonStyle}
              dangerouslySetInnerHTML={{ __html: buttonText }}
            />
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
        const renderItem = (val) => {
          if (val == null) return '';
          if (typeof val === 'string' || typeof val === 'number') return <span dangerouslySetInnerHTML={{ __html: String(val) }} />;
          if (typeof val === 'object') {
            const text = val.text || val.label || val.title || val.content || '';
            return <span dangerouslySetInnerHTML={{ __html: String(text) }} />;
          }
          return <span />;
        };
        return (
          <Tag key={blockKey} className="pro-list" style={{ textAlign: align }}>
            {items.map((item, i) => (
              <li key={i} className="pro-list-item">{renderItem(item)}</li>
            ))}
          </Tag>
        );
      }
      case "checklist": {
        const items = block.data?.items || [];
        return (
          <div key={blockKey} className="pro-checklist" style={{ textAlign: align }}>
            {items.map((item, i) => (
              <div key={i} className="pro-checklist-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '8px 0' }}>
                <input type="checkbox" checked={item.checked} readOnly style={{ marginTop: '2px' }} />
                <span dangerouslySetInnerHTML={{ __html: item.text }} />
              </div>
            ))}
          </div>
        );
      }
      case "section": {
        // Los bloques de sección actúan como separadores invisibles en el renderizado final
        // Su configuración ya fue aplicada en el agrupamiento de secciones
        return null;
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
      case "socialIcons": {
        const d = block.data || {};
        return (
          <div key={blockKey} style={{ textAlign: align }}>
            <SocialIcons data={d} />
          </div>
        );
      }
      case "code": {
        const code = block.data?.code || '';
        return (
          <pre key={blockKey} className="pro-code" style={{ 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            padding: '16px', 
            overflow: 'auto', 
            fontSize: '14px', 
            fontFamily: 'Monaco, Consolas, monospace',
            margin: '1rem 0'
          }}>
            <code dangerouslySetInnerHTML={{ __html: code }} />
          </pre>
        );
      }
      case "table": {
        const d = block.data || {};
        const content = d.content || [];
        const withHeadings = d.withHeadings || false;
        if (!content.length) return null;
        return (
          <div key={blockKey} className="pro-table-container" style={{ margin: '1.5rem 0', overflowX: 'auto' }}>
            <table className="pro-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
              {content.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => {
                    const Tag = withHeadings && i === 0 ? 'th' : 'td';
                    return (
                      <Tag key={j} style={{
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: withHeadings && i === 0 ? '#f9fafb' : 'white',
                        fontWeight: withHeadings && i === 0 ? '600' : 'normal'
                      }}>
                        {cell}
                      </Tag>
                    );
                  })}
                </tr>
              ))}
            </table>
          </div>
        );
      }
      case "delimiter": {
        return (
          <div key={blockKey} className="pro-delimiter" style={{ 
            textAlign: 'center', 
            margin: '2rem 0',
            fontSize: '1.5rem',
            opacity: 0.6
          }}>
            ***
          </div>
        );
      }
      case "warning": {
        const title = block.data?.title || 'Advertencia';
        const message = block.data?.message || '';
        return (
          <div key={blockKey} className="pro-warning" style={{
            backgroundColor: '#fef3cd',
            border: '1px solid #fecf47',
            borderRadius: '8px',
            padding: '16px',
            margin: '1rem 0'
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#8a6914' }}>{title}</h4>
            <p style={{ margin: '0', color: '#8a6914' }} dangerouslySetInnerHTML={{ __html: message }} />
          </div>
        );
      }
      case "embed": {
        const service = block.data?.service;
        const embed = block.data?.embed;
        const width = block.data?.width || 580;
        const height = block.data?.height || 320;
        const caption = block.data?.caption || '';
        
        if (!embed) return null;
        
        return (
          <div key={blockKey} className="pro-embed" style={{ margin: '1.5rem 0', textAlign: align }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: width, margin: '0 auto' }}>
              <iframe 
                src={embed} 
                width={width} 
                height={height} 
                style={{ width: '100%', border: 'none', borderRadius: '8px' }}
                allowFullScreen
              />
            </div>
            {caption && (
              <p style={{ fontSize: '14px', opacity: 0.8, textAlign: 'center', margin: '8px 0 0' }}>
                {caption}
              </p>
            )}
          </div>
        );
      }
      case "raw": {
        const html = block.data?.html || '';
        return (
          <div key={blockKey} className="pro-raw" dangerouslySetInnerHTML={{ __html: html }} />
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
    if (pageSettings.backgroundColor) {
      css += `
        body { background-color: ${pageSettings.backgroundColor} !important; }
        .pro-wrapper { background-color: ${pageSettings.backgroundColor}; padding: 20px; min-height: 100vh; }
      `;
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
  const containerBgColor = pageSettings?.containerBackgroundColor || '#f8fafc';

  // Estilos avanzados para landing profesional
  const proStyles = `
    .pro-wrapper {
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
    }

    .pro-container {
      padding: 0 !important;
      max-width: ${containerMax}px;
      margin: 0 auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${themeText};
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      background-color: transparent;
    }

    .pro-section {
      padding: 60px 40px;
    }

    .pro-section.primary {
      background-color: ${containerBgColor};
    }

    .pro-section.alternate {
      background-color: ${containerBgColor};
    }

    .pro-section.accent {
      background-color: ${pageSettings?.primaryColor ? `${pageSettings.primaryColor}10` : '#eff6ff'};
    }

    .pro-section.hero {
      background: transparent;
      padding: 0;
    }

    .pro-section-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 2rem;
      text-align: center;
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
      margin: 0 0 2rem;
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
      display: block;
      width: 100%;
    }
    
    .pro-button-container[style*="text-align: center"] .pro-button,
    .pro-button-container[style*="text-align: center"] .pro-button-column {
      display: inline-block;
      margin: 0 auto;
    }
    
    .pro-button-container[style*="text-align: right"] .pro-button,
    .pro-button-container[style*="text-align: right"] .pro-button-column {
      display: inline-block;
      float: right;
    }
    
    .pro-button-container[style*="text-align: left"] .pro-button,
    .pro-button-container[style*="text-align: left"] .pro-button-column {
      display: inline-block;
      float: left;
    }
    
    .pro-button-container::after {
      content: "";
      display: table;
      clear: both;
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

    .pro-button-primary:not([style*="background"]):not([style*="backgroundColor"]) {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 2px solid transparent;
    }

    .pro-button-primary:not([style*="color"]) {
      color: white;
    }

    .pro-button-secondary:not([style*="background"]):not([style*="backgroundColor"]) {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      border: 2px solid transparent;
    }

    .pro-button-secondary:not([style*="color"]) {
      color: white;
    }

    .pro-button-outline:not([style*="background"]):not([style*="backgroundColor"]) {
      background: transparent;
      border: 2px solid #667eea;
    }

    .pro-button-outline:not([style*="color"]) {
      color: #667eea;
    }

    .pro-button-outline:hover:not([style*="background"]):not([style*="backgroundColor"]) {
      background: #667eea;
    }

    .pro-button-outline:hover:not([style*="color"]) {
      color: white;
    }

    .pro-button-success:not([style*="background"]):not([style*="backgroundColor"]) {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: 2px solid transparent;
    }

    .pro-button-success:not([style*="color"]) {
      color: white;
    }

    .pro-button-column {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(0);
      margin-top: 1rem;
    }

    .pro-button-column:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    }

    .pro-button-column.pro-button-primary:not([style*="background"]):not([style*="backgroundColor"]) {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 2px solid transparent;
    }

    .pro-button-column.pro-button-primary:not([style*="color"]) {
      color: white;
    }

    .pro-button-column.pro-button-secondary:not([style*="background"]):not([style*="backgroundColor"]) {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      border: 2px solid transparent;
    }

    .pro-button-column.pro-button-secondary:not([style*="color"]) {
      color: white;
    }

    .pro-button-column.pro-button-outline:not([style*="background"]):not([style*="backgroundColor"]) {
      background: transparent;
      border: 2px solid #667eea;
    }

    .pro-button-column.pro-button-outline:not([style*="color"]) {
      color: #667eea;
    }

    .pro-button-column.pro-button-success:not([style*="background"]):not([style*="backgroundColor"]) {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: 2px solid transparent;
    }

    .pro-button-column.pro-button-success:not([style*="color"]) {
      color: white;
    }

    /* Hover para botones con colores personalizados */
    .pro-button-custom:hover,
    .pro-button-column.pro-button-custom:hover {
      filter: brightness(0.85);
      transform: translateY(-2px);
    }

    .pro-button-column.pro-button-custom:hover {
      transform: translateY(-1px);
    }

    .pro-columns {
      display: grid;
      gap: 2rem;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      margin: 2rem 0;
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

    .pro-checklist {
      margin: 1rem 0;
    }

    .pro-checklist-item {
      margin: 0.5rem 0;
      line-height: 1.6;
    }

    .pro-social-icons {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .pro-code {
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      line-height: 1.5;
    }

    .pro-table {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }

    .pro-delimiter {
      color: #6b7280;
      font-weight: 300;
      letter-spacing: 0.5em;
    }

    .pro-warning {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .pro-embed {
      position: relative;
    }

    .pro-embed iframe {
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .pro-columns.four-columns {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .pro-wrapper {
        padding: 12px;
      }

      .pro-container {
        border-radius: 8px;
      }

      .pro-section {
        padding: 40px 20px;
      }

      .pro-columns,
      .pro-columns.four-columns,
      .pro-columns.three-columns,
      .pro-columns.two-columns {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        margin: 1.5rem 0;
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
      .pro-wrapper {
        padding: 8px;
      }

      .pro-section {
        padding: 30px 16px;
      }

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

  // Agrupar bloques en secciones usando separadores
  const groupBlocksIntoSections = (blocks) => {
    const sections = [];
    let currentSection = { blocks: [], bgType: 'primary', title: '' };
    let sectionIndex = 0;
    
    blocks.forEach((block, index) => {
      // Bloque separador de sección
      if (block.type === 'section') {
        // Finalizar sección actual si tiene contenido
        if (currentSection.blocks.length > 0) {
          sections.push(currentSection);
        }
        
        // Iniciar nueva sección con la configuración del separador
        const bgType = block.data?.backgroundColor === 'custom' ? 'custom' : 'primary';
          
        currentSection = { 
          blocks: [], 
          bgType,
          customColor: block.data?.customColor,
          opacity: block.data?.opacity,
          title: block.data?.title || '',
          isUserDefined: true 
        };
        sectionIndex++;
        return;
      }
      
      // El hero siempre es su propia sección
      if (block.type === 'hero') {
        if (currentSection.blocks.length > 0) {
          sections.push(currentSection);
        }
        sections.push({ 
          blocks: [block], 
          bgType: 'hero',
          title: '',
          isUserDefined: false 
        });
        // Reiniciar para la siguiente sección
        currentSection = { blocks: [], bgType: sectionIndex % 2 === 0 ? 'primary' : 'alternate', title: '' };
        return;
      }
      
      // Agrupación automática: los headers h2 inician nueva sección si no hay separadores manuales
      if (block.type === 'header' && block.data?.level === 2 && currentSection.blocks.length > 0) {
        const hasManualSections = blocks.some(b => b.type === 'section');
        if (!hasManualSections) {
          sections.push(currentSection);
          currentSection = { 
            blocks: [block], 
            bgType: sectionIndex % 2 === 0 ? 'primary' : 'alternate',
            title: '' 
          };
          sectionIndex++;
        } else {
          currentSection.blocks.push(block);
        }
      } else {
        currentSection.blocks.push(block);
      }
    });
    
    // Agregar la última sección si existe
    if (currentSection.blocks.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const sections = groupBlocksIntoSections(blocks);

  return (
    <>
      {buildStyles() ? <style dangerouslySetInnerHTML={{ __html: buildStyles() }} /> : null}
      <style dangerouslySetInnerHTML={{ __html: proStyles }} />
      <div className="pro-wrapper">
        <div className="pro-container">
          {sections.map((section, sectionIndex) => {
            const bgType = section.bgType || 'primary';
            
            // Calcular color de fondo con opacidad si es custom
            let sectionBgStyle = {};
            if (bgType === 'custom' && section.customColor) {
              // Soporte para #rgb y #rrggbb
              const raw = section.customColor.replace('#', '');
              const hex = raw.length === 3
                ? raw.split('').map(c => c + c).join('')
                : raw;
              const r = parseInt(hex.substr(0, 2), 16);
              const g = parseInt(hex.substr(2, 2), 16);
              const b = parseInt(hex.substr(4, 2), 16);
              const opacity = typeof section.opacity === 'number' ? section.opacity : (section.opacity || 1);
              // Base blanca con overlay del color a la opacidad indicada
              sectionBgStyle.background = `linear-gradient(rgba(${r}, ${g}, ${b}, ${opacity}), rgba(${r}, ${g}, ${b}, ${opacity})), #ffffff`;
            }
            const sectionClass = `pro-section ${bgType}`;
            const hasTitle = section.title && section.title.trim();
            
            return (
              <div key={`section-${sectionIndex}`} className={sectionClass} style={sectionBgStyle}>
                {hasTitle && (
                  <h2 className="pro-section-title">{section.title}</h2>
                )}
                {section.blocks.map((block, blockIndex) => renderBlock(block, false, `section-${sectionIndex}-block-${blockIndex}`))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
  } catch (error) {
    console.error('Error rendering landing page:', error);
    return <p style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>Error al renderizar la página</p>;
  }
}