import '@pluginjs/font-editor/dist/font-editor.css';

// Import dinámico para evitar ejecución durante SSR
let FontEditor;
if (typeof window !== 'undefined') {
  // Solo importa en el cliente
  import('@pluginjs/font-editor').then(module => {
    FontEditor = module.default || module;
  });
}

class FontEditorTool {
  static get isInline() {
    return true;
  }

  static get title() {
    return 'Font';
  }

  constructor({api}) {
    this.api = api;
    this.button = null;
    this.fontEditor = null;
    this._state = false;
  }

  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add('ce-inline-tool');
    this.button.innerHTML = 'F';
    
    this.button.addEventListener('click', () => {
      this._toggleFontPanel();
    });
    
    return this.button;
  }
  
  _toggleFontPanel() {
    // Asegurarse de que estamos en el cliente
    if (typeof window === 'undefined') return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Si no hay texto seleccionado, no hacemos nada
    if (range.collapsed) return;
    
    // Usamos la solución de respaldo directamente ya que FontEditor es problemático
    this._applyBasicFontStyle(range);
  }
  
  _applyBasicFontStyle(range) {
    // Extraer y envolver el texto seleccionado
    const span = document.createElement('span');
    span.classList.add('js-font-editor');
    const content = range.extractContents();
    span.appendChild(content);
    range.insertNode(span);
    
    // Seleccionar el span
    const selection = window.getSelection();
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
    
    // Crear el selector de fuentes
    const fontSelector = document.createElement('div');
    fontSelector.style.position = 'absolute';
    fontSelector.style.zIndex = '1000';
    fontSelector.style.background = '#fff';
    fontSelector.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
    fontSelector.style.padding = '10px';
    fontSelector.style.borderRadius = '4px';
    
    const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Tahoma'];
    
    fonts.forEach(font => {
      const option = document.createElement('div');
      option.textContent = font;
      option.style.fontFamily = font;
      option.style.padding = '5px';
      option.style.cursor = 'pointer';
      option.style.margin = '2px 0';
      option.style.borderRadius = '3px';
      
      option.addEventListener('mouseover', () => {
        option.style.backgroundColor = '#f0f0f0';
      });
      
      option.addEventListener('mouseout', () => {
        option.style.backgroundColor = 'transparent';
      });
      
      option.addEventListener('click', () => {
        span.style.fontFamily = font;
        if (document.body.contains(fontSelector)) {
          document.body.removeChild(fontSelector);
        }
      });
      
      fontSelector.appendChild(option);
    });
    
    const rect = span.getBoundingClientRect();
    fontSelector.style.top = `${rect.bottom + window.scrollY + 5}px`;
    fontSelector.style.left = `${rect.left + window.scrollX}px`;
    
    document.body.appendChild(fontSelector);
    
    // Cerrar selector al hacer clic afuera (con verificación)
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!fontSelector.contains(e.target) && e.target !== span) {
          if (document.body.contains(fontSelector)) {
            document.body.removeChild(fontSelector);
          }
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 0);
  }
  
  checkState() {
    if (typeof window === 'undefined') return false;
    
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) {
      return false;
    }
    
    // Verifica si estamos dentro de un elemento con la clase js-font-editor
    let node = selection.anchorNode;
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode;
    }
    
    if (node && node.classList && node.classList.contains('js-font-editor')) {
      this._state = true;
      return true;
    }
    
    this._state = false;
    return false;
  }
  
  surround(range) {
    if (!range) return;
    this._toggleFontPanel();
  }
}

export default FontEditorTool;