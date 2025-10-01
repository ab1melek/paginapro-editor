import Columns from "@aaaalrashd/editorjs-columns"
import Code from '@editorjs/code'
import Delimiter from '@editorjs/delimiter'
import Embed from '@editorjs/embed'
import ImageTool from '@editorjs/image'
import InlineCode from '@editorjs/inline-code'
import Marker from '@editorjs/marker'
import Raw from '@editorjs/raw'
import Table from '@editorjs/table'
import Warning from '@editorjs/warning'
import ColorPicker from 'editorjs-color-picker'
import AlignmentTuneTool from "editorjs-text-alignment-blocktune"
import ChecklistWithColor from '../editorPlugins/ChecklistWithColor'
import ColorButtonTool from '../editorPlugins/ColorButtonTool'
import ColumnsStyleTune from '../editorPlugins/ColumnsStyleTune'
import FontEditorTool from '../editorPlugins/FontEditorTool'
import HeaderWithColor from '../editorPlugins/HeaderWithColor'
import HeroTool from '../editorPlugins/HeroTool'
import ListWithColor from '../editorPlugins/ListWithColor'
import ParagraphWithColor from '../editorPlugins/ParagraphWithColor'
import QuoteWithColor from '../editorPlugins/QuoteWithColor'
import SectionTool from '../editorPlugins/SectionTool'
import SocialIconsTool from '../editorPlugins/SocialIconsTool'
import TextColorInlineTool from '../editorPlugins/TextColorInlineTool'

export const EDITOR_JS_TOOLS = {
  paragraph: {
    class: ParagraphWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
    tunes: ["alignment"],
  },
  header: {
    class: HeaderWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
    tunes: ["alignment"],
    config: {
      levels: [1, 2, 3, 4],
      defaultLevel: 2, 
    },
  },
  list: {
    class: ListWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
  },
  checklist: {
    class: ChecklistWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
  },
  quote: {
    class: QuoteWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
  },
  ColorPicker: {
      class: ColorPicker,
   },
  textColor: {
    class: TextColorInlineTool,
  },
  fontEditor: {
    class: FontEditorTool,
    inlineToolbar: true
  },
  code: Code,
  inlineCode: InlineCode,
  embed: Embed,
  table: Table,
  warning: Warning,
  // linkTool: LinkTool,
  image: {
    class: ImageTool,
    config: {
      endpoints: {
        byFile: '/api/images', // Endpoint para subir imágenes por archivo
      },
      features: {
        border: false,
        caption: 'optional',
        stretch: false,
      },
    },
  },
  alignment: {
    class: AlignmentTuneTool,
    config: {
      default: "left",
      blocks: {
        header: "center",
        paragraph: "left",
      },
    },
  },
  raw: Raw,
  delimiter: Delimiter,
  marker: Marker,
  button: {
    class: ColorButtonTool,
  },
  columnsStyle: {
    class: ColumnsStyleTune,
  },
  columns: {
        class: Columns,
        tunes: ['columnsStyle'],
        config: {
          maxColumns: 4,
          tools: {
            header: {
              class: HeaderWithColor,
              inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
              tunes: ["alignment"],
              config: {
                levels: [1, 2, 3, 4],
                defaultLevel: 2,
              },
            },
            paragraph: {
              class: ParagraphWithColor,
              inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
              tunes: ["alignment"],
            },
            image: {
              class: ImageTool,
              config: {
                endpoints: {
                  byFile: '/api/images',
                },
                features: {
                  border: false,
                  caption: 'optional',
                  stretch: false,
                },
              },
            },
            ColorPicker: { class: ColorPicker },
            textColor: { class: TextColorInlineTool },
            marker: { class: Marker },
            inlineCode: { class: InlineCode },
            fontEditor: { class: FontEditorTool, inlineToolbar: true },
            alignment: {
              class: AlignmentTuneTool,
              config: {
                default: 'left',
                blocks: {
                  header: 'center',
                  paragraph: 'left',
                },
              },
            },
            list: { class: ListWithColor, inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'] },
            quote: {
              class: QuoteWithColor,
              inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
            },
            checklist: {
              class: ChecklistWithColor,
              inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
            },
            button: { class: ColorButtonTool },
          },
        },
      },
  socialIcons: {
    class: SocialIconsTool,
  },
  hero: {
    class: HeroTool,
  },
  section: {
    class: SectionTool,
  },
}

// Herramientas para editores anidados (sin sección para evitar recursión infinita)
export const getNestedTools = () => {
  const { section, ...nestedTools } = EDITOR_JS_TOOLS;
  return nestedTools;
};

// Uploader personalizado para añadir slug y feedback de tamaño
function createImageUploader(slug) {
  const MAX = 2 * 1024 * 1024;
  const getSlug = () => {
    try {
      // Permite pasar un slug fijo o una función; fallback al global
      const s = typeof slug === 'function' ? slug() : slug;
      const g = typeof window !== 'undefined' ? window.__PP_UPLOAD_SLUG__ : undefined;
      // Preferir el global (puede actualizarse tras cargar datos) y luego el slug fijo
      const finalSlug = (g || s || 'general').toString();
      return finalSlug;
    } catch {
      return 'general';
    }
  };
  return {
    async uploadByFile(file) {
      try {
        if (file?.size > MAX) {
          showToast('La imagen supera 2MB. Comprime o reduce la resolución e intenta de nuevo.', 'error');
          return { success: 0, error: 'too-large' };
        }
        const currentSlug = getSlug();
        const fd = new FormData();
        fd.append('image', file);
        if (currentSlug) fd.append('slug', currentSlug);
        const res = await fetch('/api/images', {
          method: 'POST',
          headers: currentSlug ? { 'x-page-slug': currentSlug } : undefined,
          body: fd,
        });
        const json = await res.json().catch(() => ({ success: 0 }));
        if (!res.ok || json.success !== 1) {
          const msg = json?.error || `Error ${res.status}`;
          showToast(msg, 'error');
          return { success: 0, error: msg };
        }
        showToast('Imagen subida', 'success');
        return json; // { success: 1, file: { url } }
      } catch (e) {
        const msg = e?.message || 'Error al subir imagen';
        showToast(msg, 'error');
        return { success: 0, error: msg };
      }
    }
  };
}

// Herramientas dinámicas con prefijo por slug en uploads
export function makeEditorTools(slug = 'general') {
  const imageConfig = {
    endpoints: { byFile: '/api/images' },
    additionalRequestData: { slug },
    additionalRequestHeaders: { 'x-page-slug': slug },
    uploader: createImageUploader(slug),
    features: { border: false, caption: 'optional', stretch: false },
  };

  const base = { ...EDITOR_JS_TOOLS };
  // Top-level image
  base.image = { class: ImageTool, config: imageConfig };

  // Columns -> nested image
  if (base.columns?.config?.tools) {
    const nested = { ...base.columns.config.tools };
    nested.image = { class: ImageTool, config: imageConfig };
    base.columns = {
      ...base.columns,
      config: { ...base.columns.config, tools: nested }
    };
  }

  return base;
}

// Toast minimalista (no bloqueante)
export function showToast(message, type = 'info') {
  try {
    if (typeof document === 'undefined') return;
    const id = 'pp-toast-container';
    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement('div');
      container.id = id;
      Object.assign(container.style, {
        position: 'fixed',
        top: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        pointerEvents: 'none',
      });
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#374151';
    Object.assign(el.style, {
      background: bg,
      color: '#fff',
      padding: '10px 12px',
      borderRadius: '8px',
      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
      fontSize: '13px',
      pointerEvents: 'auto',
      maxWidth: '320px',
    });
    el.textContent = String(message || '');
    container.appendChild(el);
    setTimeout(() => {
      try { container.removeChild(el); } catch {}
      if (!container.childElementCount) container.remove();
    }, 2600);
  } catch {}
}
