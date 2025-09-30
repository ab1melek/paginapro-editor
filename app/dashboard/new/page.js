"use client";

import { useSearchParams } from 'next/navigation';
import TemplatePicker from '../../../components/TemplatePicker';
import { templates } from '../../templates';

export default function NewPageWithTemplate() {
  const searchParams = useSearchParams();
  const preset = searchParams.get('template');
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
