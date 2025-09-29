"use client";

import TemplatePicker from '../../../components/TemplatePicker';

export default function NewPageWithTemplate() {
  const handleSelect = (data) => {
    try {
      const key = `preview-${Date.now()}`;
      sessionStorage.setItem(key, JSON.stringify(data));
      window.location.href = `/dashboard/editor?previewKey=${key}`;
    } catch (e) {
      console.warn('No se pudo guardar la plantilla en sessionStorage', e);
      // Como fallback, navegamos directo al editor sin datos
      window.location.href = '/dashboard/editor';
    }
  };

  return <TemplatePicker onSelect={handleSelect} onCancel={() => (window.location.href = '/dashboard')} />;
}
