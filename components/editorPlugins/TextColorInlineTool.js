/**
 * TextColorInlineTool
 * Inline tool simple para aplicar color al texto seleccionado usando <span style="color: ...">.
 * Sin dependencias externas. Diseñada para funcionar en cualquier bloque (incluidas columnas).
 */

export default class TextColorInlineTool {
  static get isInline() {
    return true;
  }

  static get title() {
    return 'Color';
  }

  constructor({ api, config = {} }) {
    this.api = api;
    this.button = null;
    this._lastColor = config.defaultColor || '#111111';
    this._input = null;
    this.colors = Array.isArray(config.colors) && config.colors.length
      ? config.colors
      : ['#FF3B30','#FF9500','#FFCC00','#34C759','#007AFF','#AF52DE','#5856D6','#5AC8FA','#8E8E93','#111111','#FFFFFF'];
    this._panel = null;
    this._savedSelection = null;
  }

  render() {
    // Botón de la toolbar inline
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('ce-inline-tool');
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.gap = '4px';
    button.style.width = '28px';
    button.style.height = '28px';
    button.title = 'Color de texto';

    const label = document.createElement('span');
    label.textContent = 'A';
    label.style.fontWeight = '600';

    const swatch = document.createElement('span');
    swatch.style.display = 'inline-block';
    swatch.style.width = '10px';
    swatch.style.height = '10px';
    swatch.style.borderRadius = '2px';
    swatch.style.border = '1px solid rgba(0,0,0,.2)';
    swatch.style.background = this._lastColor;

    button.appendChild(label);
    button.appendChild(swatch);

    // Click: abrir paleta popover
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Guardar selección actual antes de abrir la paleta
      try { this._savedSelection = this.api.selection.save(); } catch {}
      this._togglePalette(button, (color) => {
        this._lastColor = color;
        swatch.style.background = color;
        // Restaurar selección y aplicar
        try { if (this._savedSelection) this.api.selection.restore(this._savedSelection); } catch {}
        this._applyColorToSelection(color);
        this._savedSelection = null;
      });
    });

    // Guardar refs
    this.button = button;

    return button;
  }

  surround(range) {
    // Editor.js llama a surround al activar la herramienta.
    // Aquí aplicamos el último color elegido si hay selección.
    if (!range || range.collapsed) return;
    this._applyColorToRange(range, this._lastColor);
  }

  _applyColorToSelection(color) {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    this._applyColorToRange(range, color);
  }

  _applyColorToRange(range, color) {
    try {
      const span = document.createElement('span');
      span.style.color = color;
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);

      // Reposicionar selección para seguir editando
      const sel = window.getSelection();
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      newRange.collapse(false);
      sel.addRange(newRange);
    } catch (_) {
      // En casos de rangos complejos, fallback: envolver el nodo de texto padre más cercano
      const node = range.startContainer?.parentNode;
      if (node && node.nodeType === Node.ELEMENT_NODE) {
        node.style.color = color;
      }
    }
  }

  _togglePalette(anchorEl, onPick) {
    if (typeof document === 'undefined') return;
    // Cerrar si ya está abierto
    if (this._panel && document.body.contains(this._panel)) {
      document.body.removeChild(this._panel);
      this._panel = null;
      return;
    }

    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.zIndex = '10000';
    panel.style.background = '#fff';
    panel.style.boxShadow = '0 6px 20px rgba(0,0,0,.15)';
    panel.style.borderRadius = '8px';
    panel.style.padding = '10px';
    panel.style.display = 'grid';
    panel.style.gridTemplateColumns = 'repeat(7, 18px)';
    panel.style.gap = '8px';

    const makeDot = (color) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.style.width = '18px';
      dot.style.height = '18px';
      dot.style.borderRadius = '50%';
      dot.style.border = '1px solid rgba(0,0,0,.2)';
      dot.style.background = color;
      dot.style.cursor = 'pointer';
      // Evitar que el mousedown colapse la selección
      dot.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); });
      dot.addEventListener('click', () => {
        onPick(color);
        if (panel.parentNode) panel.parentNode.removeChild(panel);
        this._panel = null;
        document.removeEventListener('mousedown', onDoc);
      });
      return dot;
    };

    this.colors.forEach(c => panel.appendChild(makeDot(c)));

    // Posicionar cerca del botón
    const rect = anchorEl.getBoundingClientRect();
    panel.style.top = `${rect.bottom + window.scrollY + 8}px`;
    panel.style.left = `${rect.left + window.scrollX}px`;
    document.body.appendChild(panel);
    this._panel = panel;

    const onDoc = (ev) => {
      // No cerrar si el click es dentro del panel o en el botón
      if (panel.contains(ev.target) || ev.target === anchorEl) return;
      // Cerrar si el click es fuera
      if (!panel.contains(ev.target)) {
        if (panel.parentNode) panel.parentNode.removeChild(panel);
        this._panel = null;
        document.removeEventListener('mousedown', onDoc);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
  }

  checkState() {
    // Marca activo si el nodo actual tiene color aplicado
    if (typeof window === 'undefined') return false;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return false;
    let node = sel.anchorNode;
    while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
    const isActive = !!(node && node.style && node.style.color);
    if (this.button) this.button.classList.toggle(this.api.styles.inlineToolButtonActive, isActive);
    return isActive;
  }

  clear() {
    // Limpieza del input si hiciera falta
    if (this._input && this._input.parentNode) {
      this._input.parentNode.removeChild(this._input);
    }
    this._input = null;
  }
}
