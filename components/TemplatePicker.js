"use client";

import Image from 'next/image';
import { useState } from 'react';
import { templates } from '../app/templates';

export default function TemplatePicker({ onSelect, onCancel }) {
  const [selected, setSelected] = useState(null);
  const [broken, setBroken] = useState({}); // id -> true si falló

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>¿Qué tipo de página quieres crear?</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 16 }}>
        {templates.map(t => (
          <div key={t.id} onClick={() => setSelected(t.id)} style={{ cursor: 'pointer', border: selected === t.id ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#f3f4f6' }}>
              {!broken[t.id] && t.thumbnail ? (
                <Image 
                  src={t.thumbnail}
                  alt={t.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  onError={() => setBroken((b) => ({ ...b, [t.id]: true }))}
                />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                  background: 'repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 10px,#f3f4f6 10px,#f3f4f6 20px)'
                }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Sin preview</span>
                </div>
              )}
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{t.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        {onCancel && (
          <button onClick={onCancel} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }}>Cancelar</button>
        )}
        <button disabled={!selected} onClick={() => { const tpl = templates.find(x => x.id === selected); if (tpl) onSelect?.(tpl.data); }} style={{ padding: '8px 12px', background: selected ? '#2563eb' : '#9ca3af', color: '#fff', border: 'none', borderRadius: 6 }}>Continuar</button>
      </div>
    </div>
  );
}
