"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import TemplatePicker from '../../../components/TemplatePicker';
import { templates } from '../../templates';

function NewPageInner() {
  const searchParams = useSearchParams();
  const preset = searchParams.get('template');
  
  // Normalizador simple de slug
  const toSlug = (value) => {
    try {
      if (!value) return '';
      return value
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    } catch { return ''; }
  };

  const generateUniqueSlug = async (baseSlug) => {
    let slug = baseSlug;
    let counter = 0;
    while (true) {
      try {
        const res = await fetch(`/api/editor?slug=${encodeURIComponent(slug)}`);
        if (res.status === 404) return slug; // libre
        counter++;
        slug = `${baseSlug}-${counter}`;
      } catch {
        return `${baseSlug}-${Date.now()}`; // fallback
      }
    }
  };

  const promptUniqueSlug = async () => {
    if (typeof window === 'undefined') return null;
    while (true) {
      const input = window.prompt('Ingresa el título (se usará como slug para la URL):');
      if (input === null) return null; // cancelado
      const s = toSlug(input);
      if (!s) { alert('El título/slug no puede estar vacío.'); continue; }
      try {
        const res = await fetch(`/api/editor?slug=${encodeURIComponent(s)}`);
        if (res.status === 404) return { slug: s, name: input };
        const suggestion = await generateUniqueSlug(s);
        const accept = window.confirm(`El slug "${s}" ya existe. ¿Usar "${suggestion}"?`);
        if (accept) return { slug: suggestion, name: input || suggestion };
      } catch {
        const fallback = `${s}-${Date.now()}`;
        const accept = window.confirm(`No se pudo verificar el slug. ¿Usar "${fallback}" igualmente?`);
        if (accept) return { slug: fallback, name: input || fallback };
      }
    }
  };

  const handleSelect = async (templateData) => {
    // 1) Pedir slug
    const picked = await promptUniqueSlug();
    if (!picked) { window.location.href = '/dashboard'; return; }
    // 2) Preparar payload para API (mapeando name -> title)
    const payload = {
      ...(Array.isArray(templateData) ? (templateData[0] || {}) : templateData),
      slug: picked.slug,
      title: picked.name || picked.slug,
      name: undefined, // no enviar "name" a DB
    };
    try {
      const res = await fetch('/api/editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = out?.error || `Error ${res.status}`;
        alert(`No se pudo crear la página: ${msg}`);
        return;
      }
      // 3) Ir al dashboard; edición se hace luego desde la lista
      window.location.href = '/dashboard';
    } catch (e) {
      alert(`Error al crear la página: ${e?.message || 'desconocido'}`);
    }
  };

  // Si viene ?template=, cargarla directamente
  if (preset) {
    const tpl = templates.find(t => t.id === preset);
    if (tpl?.data) {
      handleSelect(tpl.data);
      return null;
    }
  }

  return <TemplatePicker onSelect={handleSelect} onCancel={() => (window.location.href = '/dashboard')} />;
}

export default function NewPageWithTemplate() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Cargando…</div>}>
      <NewPageInner />
    </Suspense>
  );
}
