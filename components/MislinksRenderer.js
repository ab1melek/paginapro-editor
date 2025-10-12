"use client";

import SocialIcons from "./SocialIcons";
import { normalize } from "./utils/editorRender";

export default function MislinksRenderer({ data }) {
  try {
    const { blocks, pageSettings } = normalize(data);
    if (!blocks || !blocks.length) {
      return <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>Sin contenido</p>;
    }

  const bgColor = pageSettings?.backgroundColor || '#111827';
  const bgImageUrl = pageSettings?.backgroundImageUrl || null;
  const textColor = pageSettings?.textColor || '#ffffff';
  const overlayColor = pageSettings?.backgroundOverlayColor || null; // ej: '#000000'
  const overlayOpacity = typeof pageSettings?.backgroundOverlayOpacity === 'number' ? pageSettings.backgroundOverlayOpacity : null; // 0..1

    // Extraer bloques clave
    const firstImage = blocks.find(b => b.type === 'image' && (b.data?.file?.url || b.data?.url));
    const firstHeader = blocks.find(b => b.type === 'header');
    const firstParagraph = blocks.find(b => b.type === 'paragraph');
    const socialBlock = blocks.find(b => b.type === 'socialIcons');
    const buttonBlocks = blocks.filter(b => b.type === 'button').slice(0, 5);

  const avatarUrl = firstImage?.data?.file?.url || firstImage?.data?.url || null;
    const titleText = firstHeader?.data?.text || '';
    const paragraphHtml = (firstParagraph?.data?.text || '').replace(/\n/g, '<br>');

    // Helper para rgba desde hex
    const hexToRgba = (hex, a = 1) => {
      try {
        if (!hex) return '';
        const h = hex.replace('#','');
        const v = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
        const n = parseInt(v, 16);
        const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
      } catch { return ''; }
    };

    const wrapperStyle = {
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 'calc(24px + env(safe-area-inset-top))',
      paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
      paddingLeft: 24,
      paddingRight: 24,
      backgroundColor: bgColor,
      // Si hay imagen de fondo y overlay configurado, aplicarlo como gradiente sobre la imagen
      ...(bgImageUrl ? (
        (overlayColor && typeof overlayOpacity === 'number')
          ? { backgroundImage: `linear-gradient(${hexToRgba(overlayColor, overlayOpacity)}, ${hexToRgba(overlayColor, overlayOpacity)}), url(${bgImageUrl})` }
          : { backgroundImage: `url(${bgImageUrl})` }
      ) : {}),
      ...(bgImageUrl ? {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : {}),
    };

    const cardStyle = {
      width: '100%',
      maxWidth: pageSettings?.maxWidth || 560,
      textAlign: 'center',
      // No forzamos color aquí: el contenedor (.editor-content-container) debe aplicar
      // pageSettings.textColor y los elementos deben heredar con `color: inherit`.
      // Esto permite que la UI del editor y el SSR mantengan la coherencia.
      color: 'inherit',
      marginLeft: 'auto',
      marginRight: 'auto',
    };

    const avatarStyle = {
      width: 'var(--avatar-size)',
      height: 'var(--avatar-size)',
      borderRadius: '50%',
      objectFit: 'cover',
      display: 'block',
      margin: '0 auto 16px',
      border: '3px solid rgba(255,255,255,0.8)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
    };

    const titleStyle = {
      fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)',
      fontWeight: 800,
      margin: '4px 0 10px',
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
      textShadow: '0 1px 2px rgba(0,0,0,0.15)',
      color: 'inherit'
    };

    const bioStyle = {
      fontSize: 'clamp(0.95rem, 2.2vw, 1.05rem)',
      opacity: 0.9,
      margin: '0 0 16px',
      textShadow: '0 1px 1px rgba(0,0,0,0.1)',
      color: 'inherit'
    };

    const containerBg = pageSettings?.containerBackgroundColor || pageSettings?.backgroundColor || null;

    const buttonsWrapStyle = {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      marginTop: 14,
      width: '100%',
      maxWidth: 'var(--buttons-max-width)',
      marginLeft: 'auto',
      marginRight: 'auto'
    };

    const buttonBaseStyle = {
      display: 'block',
      width: '100%',
      padding: 'var(--button-padding)',
      borderRadius: 'var(--button-radius)',
      textDecoration: 'none',
      fontWeight: 700,
      fontSize: '1rem',
      border: '2px solid transparent',
      background: 'rgba(255,255,255,0.08)',
      // Por defecto heredar el color del contenedor; si el botón define textColor se usará ese valor
      color: 'inherit',
      textAlign: 'center',
      backdropFilter: 'saturate(140%) blur(2px)',
      WebkitBackdropFilter: 'saturate(140%) blur(2px)',
      transition: 'transform .15s ease, box-shadow .2s ease, filter .2s ease',
      minHeight: 44,
    };

    const buttonHover = {
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
      filter: 'brightness(0.97)'
    };

    const responsiveCss = `
      .ml-wrapper {
        --avatar-size: 128px;
        --button-radius: 14px;
        --button-padding: 14px 18px;
        --buttons-max-width: 560px;
      }
      @media (max-width: 480px) {
        .ml-wrapper {
          padding-left: 16px;
          padding-right: 16px;
          --avatar-size: 96px;
          --button-radius: 12px;
          --button-padding: 12px 16px;
          --buttons-max-width: 480px;
        }
        .ml-card { padding: 0 4px; }
      }
      @media (max-width: 360px) {
        .ml-wrapper {
          padding-left: 12px;
          padding-right: 12px;
          --avatar-size: 88px;
          --button-radius: 10px;
          --button-padding: 10px 14px;
          --buttons-max-width: 440px;
        }
      }
    `;

    return (
      <div className="ml-wrapper" style={wrapperStyle}>
        <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
        <div className="ml-card" style={cardStyle}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={titleText || 'Avatar'} style={avatarStyle} />
          ) : null}

          {titleText ? (
            <h1 className="ml-title" style={titleStyle} dangerouslySetInnerHTML={{ __html: titleText }} />
          ) : null}

          {firstParagraph ? (
            <p className="ml-bio" style={bioStyle} dangerouslySetInnerHTML={{ __html: paragraphHtml }} />
          ) : null}

          {socialBlock ? (
            <div style={{ margin: '8px 0 10px' }}>
              <SocialIcons data={{
                ...socialBlock.data,
                fgColor: socialBlock.data?.fgColor || textColor,
                alignment: socialBlock.data?.alignment || 'center'
              }} />
            </div>
          ) : null}

          {buttonBlocks && buttonBlocks.length > 0 ? (
            <div className="ml-buttons" style={buttonsWrapStyle}>
              {buttonBlocks.map((btn, i) => {
                const t = btn.data?.text || 'Abrir';
                const href = btn.data?.link || '#';
                const bg = btn.data?.bgColor;
                // Calcular color de texto por contraste si no viene definido
                const pickText = (bgHex) => {
                  try {
                    if (!bgHex) return '#ffffff';
                    const h = bgHex.replace('#','');
                    const v = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
                    const r = parseInt(v.substr(0,2),16), g = parseInt(v.substr(2,2),16), b = parseInt(v.substr(4,2),16);
                    // luminancia relativa
                    const srgb = [r,g,b].map(c => {
                      const cs = c/255;
                      return cs <= 0.03928 ? cs/12.92 : Math.pow((cs+0.055)/1.055, 2.4);
                    });
                    const L = 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
                    return L > 0.5 ? '#111827' : '#ffffff';
                  } catch { return '#ffffff'; }
                };
                // Determine a sensible default background when the button doesn't specify one
                const isLight = (hex) => {
                  try {
                    if (!hex) return false;
                    const h = hex.replace('#','');
                    const v = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
                    const r = parseInt(v.substr(0,2),16), g = parseInt(v.substr(2,2),16), b = parseInt(v.substr(4,2),16);
                    const srgb = [r,g,b].map(c => {
                      const cs = c/255;
                      return cs <= 0.03928 ? cs/12.92 : Math.pow((cs+0.055)/1.055, 2.4);
                    });
                    const L = 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
                    return L > 0.6;
                  } catch { return false; }
                };

                const defaultButtonBg = containerBg && isLight(containerBg) ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';

                const style = {
                  ...buttonBaseStyle,
                  ...(bg ? { background: bg, borderColor: bg } : { background: defaultButtonBg, borderColor: 'transparent' }),
                  ...(btn.data?.textColor ? { color: btn.data.textColor } : (bg ? { color: pickText(bg) } : { color: 'inherit' })),
                };
                return (
                  <a
                    key={btn.id || i}
                    href={href}
                    className="ml-button"
                    style={style}
                    role="button"
                    aria-label={t.replace(/<[^>]*>/g,'')}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: 'none', filter: 'none' })}
                    dangerouslySetInnerHTML={{ __html: t }}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering mislinks page:', error);
    return <p style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>Error al renderizar la página</p>;
  }
}
