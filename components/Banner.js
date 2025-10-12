export default function Banner({ data }) {
  const d = data || {};
  const img = d.image || d.url || null;
  const t1 = d.title1 || d.title || '';
  const t2 = d.title2 || '';
  const t3 = d.title3 || '';

  const style = {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 18,
    display: 'flex',
    alignItems: 'stretch',
    background: '#f5f5f5'
  };

  const imgStyle = {
    flex: '0 0 40%',
    objectFit: 'cover',
    width: '40%',
    height: 160
  };

  const contentStyle = {
    flex: 1,
    padding: '18px 22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 6
  };

  return (
    <div className="mn-banner" style={style}>
      {img ? <img src={img} alt={t1 || 'Banner'} style={imgStyle} /> : null}
      <div style={contentStyle}>
        {t1 ? <div className="mn-banner-title" style={{ fontSize: '1.6rem', fontWeight: 800 }}>{t1}</div> : null}
        {t2 ? <div className="mn-banner-sub" style={{ fontSize: '1rem', opacity: 0.9 }}>{t2}</div> : null}
        {t3 ? <div className="mn-banner-sub" style={{ fontSize: '.95rem', opacity: 0.85 }}>{t3}</div> : null}
      </div>
    </div>
  );
}
