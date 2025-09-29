import EditorJS from "@editorjs/editorjs";
import InlineCode from '@editorjs/inline-code';
import Marker from '@editorjs/marker';
import ColorPicker from 'editorjs-color-picker';
import AlignmentTuneTool from "editorjs-text-alignment-blocktune";
import ChecklistWithColor from './ChecklistWithColor';
import ColorButtonTool from './ColorButtonTool';
import FontEditorTool from './FontEditorTool';
import HeaderWithColor from './HeaderWithColor';
import ListWithColor from './ListWithColor';
import ParagraphWithColor from './ParagraphWithColor';
import QuoteWithColor from './QuoteWithColor';
import TextColorInlineTool from './TextColorInlineTool';

// HeroTool: bloque hero que actúa como contenedor con bloques anidados (sin herramienta de imagen)

export default class HeroTool {
  static get toolbox() {
    return {
      title: 'Hero',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3H4zm0 5h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>'
    };
  }

  constructor({ data, api }) {
    this.api = api;
    this.data = {
      // bloques anidados; migración desde title/subtitle/buttonText
      blocks: Array.isArray(data?.blocks) ? data.blocks : undefined,
      align: data?.align || 'center',
      bg: typeof data?.bg === 'string' ? data.bg : '',
      overlayColor: data?.overlayColor || '',
      overlayOpacity: typeof data?.overlayOpacity === 'number' ? data.overlayOpacity : 0,
      paddingTop: typeof data?.paddingTop === 'number' ? data.paddingTop : 72,
      paddingBottom: typeof data?.paddingBottom === 'number' ? data.paddingBottom : 48,
    };
    this.wrapper = null;
    this.nested = null; // EditorJS anidado

    // Si no hay blocks, construirlos a partir de los campos legacy
    if (!this.data.blocks) {
      const legacyTitle = data?.title || 'Tu producto, mejor que nunca';
      const legacySubtitle = data?.subtitle || 'Atrae, convierte y retén clientes con una experiencia impecable.';
      const legacyBtnText = data?.buttonText || 'Comenzar ahora';
      const legacyBtnLink = data?.buttonLink || '#';
      this.data.blocks = [
        { type: 'header', data: { text: legacyTitle, level: 1 }, tunes: { alignment: { alignment: 'center' } } },
        { type: 'paragraph', data: { text: legacySubtitle }, tunes: { alignment: { alignment: 'center' } } },
        { type: 'button', data: { text: legacyBtnText, link: legacyBtnLink, bgColor: '#2563eb', textColor: '#ffffff', align: 'center' } }
      ];
    }
  }

  render() {
    const w = document.createElement('div');
    w.style.border = '1px solid #e5e7eb';
    w.style.borderRadius = '8px';
    w.style.padding = '12px';
    w.style.background = '#fff';
    w.style.margin = '8px 0';
    w.style.display = 'grid';
    w.style.gap = '10px';

    const row = (label, el) => {
      const r = document.createElement('div');
      r.style.display = 'grid';
      r.style.gridTemplateColumns = '140px 1fr';
      r.style.alignItems = 'center';
      r.style.gap = '8px';
      const l = document.createElement('label'); l.textContent = label; l.style.fontSize='12px'; l.style.fontWeight='600';
      r.appendChild(l); r.appendChild(el); return r;
    };

    const input = (type, value, onInput, attrs={}) => {
      const i = document.createElement('input');
      i.type = type; i.value = value ?? '';
      Object.entries(attrs).forEach(([k,v]) => i.setAttribute(k, v));
      i.oninput = () => onInput(i.value);
      i.style.width='100%';
      return i;
    };

    const select = (value, opts, onChange) => {
      const s = document.createElement('select');
      opts.forEach(o => { const op = document.createElement('option'); op.value=o.value; op.textContent=o.label; if (o.value===value) op.selected=true; s.appendChild(op); });
      s.onchange = () => onChange(s.value);
      return s;
    };

    // Alineación se controla con los bloques internos; no exponemos control aquí

  // Fondo color (simple). Si subes imagen, se reemplaza por url(...)
  const initialColor = (typeof this.data.bg === 'string' && this.data.bg.startsWith('#')) ? this.data.bg : '#ffffff';
  const bgColor = input('color', initialColor, v => { this.data.bg = v; applyStyles(); });

  const overlayColor = input('color', this.data.overlayColor || '#000000', v => { this.data.overlayColor = v; applyStyles(); });
    const overlayOpacity = document.createElement('input');
    overlayOpacity.type = 'range'; overlayOpacity.min='0'; overlayOpacity.max='0.8'; overlayOpacity.step='0.05';
    overlayOpacity.value = String(this.data.overlayOpacity || 0);
  overlayOpacity.oninput = () => { this.data.overlayOpacity = parseFloat(overlayOpacity.value); applyStyles(); };

  // Padding fijo; controles removidos para simplificar UI

    // Contenedor del hero que aplica estilos y aloja al editor anidado
    const heroContainer = document.createElement('div');
    heroContainer.style.border='1px solid #e5e7eb'; heroContainer.style.borderRadius='10px'; heroContainer.style.padding='16px'; heroContainer.style.marginTop='10px';
    heroContainer.style.textAlign = this.data.align || 'center';
    const applyStyles = () => {
      // Compose overlay over bg
      const base = this.data.bg || '#ffffff';
      const o = (hex, a=1) => {
        if (!hex) return '';
        const h = hex.replace('#',''); const V = h.length===3 ? h.split('').map(c=>c+c).join('') : h; const x = parseInt(V,16);
        const r=(x>>16)&255, g=(x>>8)&255, b=x&255; return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
      };
      const bg = (this.data.overlayColor && (typeof this.data.overlayOpacity === 'number') && this.data.overlayOpacity>0)
        ? `linear-gradient(${o(this.data.overlayColor, this.data.overlayOpacity)}, ${o(this.data.overlayColor, this.data.overlayOpacity)}), ${base}`
        : base;
      heroContainer.style.background = bg;
      heroContainer.style.paddingTop = (this.data.paddingTop||72)+'px';
      heroContainer.style.paddingBottom = (this.data.paddingBottom||48)+'px';
    };
    applyStyles();

    // Layout de controles
  w.appendChild(row('Fondo color', bgColor));
    // Subida de imagen
    const file = document.createElement('input'); file.type='file'; file.accept='image/*';
    const fileRow = document.createElement('div'); fileRow.style.display='flex'; fileRow.style.gap='8px';
  const clearBtn = document.createElement('button'); clearBtn.type='button'; clearBtn.textContent='Quitar';
  clearBtn.onclick = () => { this.data.bg = bgColor.value || '#ffffff'; applyStyles(); };
    file.onchange = async () => {
      const f = file.files?.[0]; if (!f) return;
      try {
        const fd = new FormData(); fd.append('image', f);
        const res = await fetch('/api/images', { method: 'POST', body: fd });
        const json = await res.json();
        if (res.ok && json?.file?.url) {
          this.data.bg = `url(${json.file.url}) center/cover no-repeat`;
          applyStyles();
        } else { alert(json?.error || 'No se pudo subir la imagen'); }
      } catch (e) { console.error('Hero upload error', e); alert('Error al subir imagen'); }
    };
    fileRow.append(file, clearBtn);
    w.appendChild(row('Fondo (imagen)', fileRow));
    w.appendChild(row('Overlay color', overlayColor));
    w.appendChild(row('Overlay opacidad', overlayOpacity));
    // El heroContainer hace de preview y contenedor de contenido

    // Contenedor para el editor anidado
  const nestedHolder = document.createElement('div');
  nestedHolder.style.minHeight = '40px';
  heroContainer.appendChild(nestedHolder);
  w.appendChild(heroContainer);

    // Inicializar EditorJS anidado con herramientas (sin imagen)
    const nestedTools = {
      header: { class: HeaderWithColor, inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'], tunes: ['alignment'], config: { levels: [1,2,3,4], defaultLevel: 1 } },
      paragraph: { class: ParagraphWithColor, inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'], tunes: ['alignment'] },
      list: { class: ListWithColor, inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'] },
      checklist: { class: ChecklistWithColor, inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'] },
      quote: { class: QuoteWithColor, inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'] },
      ColorPicker: { class: ColorPicker },
      textColor: { class: TextColorInlineTool },
      fontEditor: { class: FontEditorTool, inlineToolbar: true },
      button: { class: ColorButtonTool },
      alignment: { class: AlignmentTuneTool, config: { default: 'center', blocks: { header: 'center', paragraph: 'center' } } },
      marker: Marker,
      inlineCode: InlineCode,
    };

    this.nested = new EditorJS({
      holder: nestedHolder,
      tools: nestedTools,
      data: { blocks: Array.isArray(this.data.blocks) ? this.data.blocks : [] },
      onChange: async () => {
        try {
          const d = await this.nested.save();
          this.data.blocks = Array.isArray(d?.blocks) ? d.blocks : [];
        } catch {}
      }
    });

    this.wrapper = w;
    return w;
  }

  save() {
    return { ...this.data };
  }
}
