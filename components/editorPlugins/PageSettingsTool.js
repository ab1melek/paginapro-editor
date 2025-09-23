/**
 * PageSettingsTool
 * Bloque para configurar estilos globales de la página.
 * Guarda en JSON bajo block.data y será extraído a root.pageSettings al guardar.
 * Estructura: { backgroundColor, containerBackgroundColor, containerOpacity }
 */

export default class PageSettingsTool {
  static get toolbox() {
    return {
      title: 'Ajustes de Página',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
    };
  }

  constructor({ data, api }) {
    this.api = api;
    this.data = {
      backgroundColor: data?.backgroundColor || '#ffffff',
      containerBackgroundColor: data?.containerBackgroundColor || '#ffffff',
      containerOpacity: typeof data?.containerOpacity === 'number' ? data.containerOpacity : 1,
    };
    this.wrapper = null;
    // refs para aplicar estilos inmediatos en modo edición
    if (typeof window !== 'undefined') {
      this.editorRoot = document.querySelector('.codex-editor');
      this.contentRoot = document.querySelector('#editorjs');
    }
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('page-settings-block');
    wrapper.style.border = '1px dashed #ddd';
    wrapper.style.borderRadius = '6px';
    wrapper.style.padding = '12px';
    wrapper.style.background = '#fafafa';
    wrapper.style.margin = '8px 0';

    const title = document.createElement('div');
    title.textContent = 'Ajustes de Página';
    title.style.fontWeight = '600';
    title.style.marginBottom = '8px';

    const desc = document.createElement('div');
    desc.textContent = 'Configura el color de fondo general y del contenedor del editor.';
    desc.style.fontSize = '12px';
    desc.style.opacity = '0.8';
    desc.style.marginBottom = '10px';

    const pageColor = this._colorPicker('Fondo de página', this.data.backgroundColor, (val) => {
      this.data.backgroundColor = val;
      this.applyStyles();
    });

    const contColor = this._colorPicker('Fondo del contenedor', this.data.containerBackgroundColor, (val) => {
      this.data.containerBackgroundColor = val;
      this.applyStyles();
    });

    const opacity = this._opacitySlider('Opacidad del contenedor', this.data.containerOpacity, (val) => {
      this.data.containerOpacity = val;
      this.applyStyles();
    });

    wrapper.appendChild(title);
    wrapper.appendChild(desc);
    wrapper.appendChild(pageColor);
    wrapper.appendChild(contColor);
    wrapper.appendChild(opacity);

    this.wrapper = wrapper;
    // aplicar estilos iniciales
    this.applyStyles();
    return wrapper;
  }

  applyStyles() {
    if (typeof document === 'undefined') return;
    try {
      if (document.body && this.data.backgroundColor) {
        document.body.style.backgroundColor = this.data.backgroundColor;
      }
      // Intentar aplicar al contenedor visual del editor
      const mainContainer = document.querySelector('.editor-content-container') || this.contentRoot || document.querySelector('.codex-editor__redactor');
      if (mainContainer) {
        if (this.data.containerBackgroundColor) mainContainer.style.backgroundColor = this.data.containerBackgroundColor;
        if (typeof this.data.containerOpacity === 'number') mainContainer.style.opacity = this.data.containerOpacity;
      }
    } catch (e) {
      // fail-safe silencioso
    }
  }

  renderSettings() {
    const holder = document.createElement('div');
    holder.style.display = 'grid';
    holder.style.gap = '10px';

    holder.appendChild(this._colorPicker('Fondo de página', this.data.backgroundColor, (val) => {
      this.data.backgroundColor = val;
      this.applyStyles();
    }));

    holder.appendChild(this._colorPicker('Fondo del contenedor', this.data.containerBackgroundColor, (val) => {
      this.data.containerBackgroundColor = val;
      this.applyStyles();
    }));

    holder.appendChild(this._opacitySlider('Opacidad del contenedor', this.data.containerOpacity, (val) => {
      this.data.containerOpacity = val;
      this.applyStyles();
    }));

    return holder;
  }

  _colorPicker(label, value, onChange) {
    const wrap = document.createElement('div');
    const lab = document.createElement('label');
    lab.textContent = label;
    lab.style.display = 'block';
    lab.style.fontSize = '12px';
    lab.style.marginBottom = '6px';

    const input = document.createElement('input');
    input.type = 'color';
    input.value = value || '#ffffff';
    input.style.width = '100%';
    input.addEventListener('input', (e) => onChange(e.target.value));

    wrap.appendChild(lab);
    wrap.appendChild(input);
    return wrap;
  }

  _opacitySlider(label, value, onChange) {
    const wrap = document.createElement('div');
    const lab = document.createElement('label');
    lab.textContent = label;
    lab.style.display = 'block';
    lab.style.fontSize = '12px';
    lab.style.marginBottom = '6px';

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '0.01';
    input.value = typeof value === 'number' ? String(value) : '1';
    input.style.flex = '1';

    const valSpan = document.createElement('span');
    const toPct = (v) => `${Math.round(parseFloat(v) * 100)}%`;
    valSpan.textContent = toPct(input.value);
    valSpan.style.minWidth = '36px';
    valSpan.style.textAlign = 'right';

    input.addEventListener('input', (e) => {
      const v = e.target.value;
      valSpan.textContent = toPct(v);
      onChange(parseFloat(v));
    });

    row.appendChild(input);
    row.appendChild(valSpan);
    wrap.appendChild(lab);
    wrap.appendChild(row);
    return wrap;
  }

  save() {
    return { ...this.data };
  }
}
