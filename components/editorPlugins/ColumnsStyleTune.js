/**
 * ColumnsStyleTune
 * Tune para el bloque "columns" que permite color y opacidad por columna.
 * Guarda en block.tunes.columnsStyle: { backgrounds: [ { color, opacity }, ... ] }
 */

export default class ColumnsStyleTune {
  static get isTune() {
    return true;
  }

  constructor({ api, data, config, block }) {
    this.api = api;
    this.block = block;
    const defaults = { backgrounds: [] };
    this.data = Object.assign({}, defaults, data || {});
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'grid';
    wrapper.style.gap = '8px';

    const title = document.createElement('div');
    title.textContent = 'Color';
    title.style.fontSize = '12px';
    title.style.fontWeight = '600';
    title.style.opacity = '0.9';
    wrapper.appendChild(title);

    // Intentar inferir número de columnas desde block.data.blocks
    const nested = this.block?.data?.blocks;
    const columnsCount = Array.isArray(nested) ? nested.length : 0;
    if (columnsCount <= 0) {
      const info = document.createElement('div');
      info.textContent = 'No hay columnas para configurar';
      info.style.fontSize = '12px';
      info.style.opacity = '0.8';
      wrapper.appendChild(info);
      return wrapper;
    }

    // Asegurar longitud de backgrounds (solo color)
    if (!Array.isArray(this.data.backgrounds)) this.data.backgrounds = [];
    while (this.data.backgrounds.length < columnsCount) {
      this.data.backgrounds.push({ color: '#ffffff' });
    }

    for (let i = 0; i < columnsCount && i < 4; i++) {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr auto';
      row.style.alignItems = 'center';
      row.style.gap = '8px';

  const label = document.createElement('div');
  label.textContent = `Columna ${i + 1}`;
      label.style.fontSize = '12px';
      label.style.fontWeight = '600';

      const controls = document.createElement('div');
      controls.style.display = 'grid';
      controls.style.gridTemplateColumns = '120px 1fr';
      controls.style.gap = '8px';

      // Color
      const inputColor = document.createElement('input');
      inputColor.type = 'color';
      inputColor.value = this.data.backgrounds[i]?.color || '#ffffff';
      inputColor.addEventListener('input', (e) => {
        this.data.backgrounds[i].color = e.target.value;
      });

      controls.appendChild(inputColor);
      row.appendChild(label);
      row.appendChild(controls);
      wrapper.appendChild(row);
    }

    return wrapper;
  }

  save() {
    return this.data;
  }
}
