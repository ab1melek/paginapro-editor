export default class SectionTool {
  static get toolbox() {
    return {
      title: 'Sección',
      icon: '<svg width="17" height="15" viewBox="0 0 17 15" fill="none"><path d="M1 1h15M1 7h15M1 13h15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    };
  }

  constructor({ data, api }) {
    this.api = api;
    this.data = {
      backgroundColor: data?.backgroundColor || 'custom',
      customColor: data?.customColor || '#ffffff',
      opacity: data?.opacity || 1,
      title: data?.title || '',
      blocks: Array.isArray(data?.blocks) ? data.blocks : []
    };
    this.wrapper = null;
    this.nested = null;
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('section-block');
    wrapper.style.border = '1px dashed #d1d5db';
    wrapper.style.borderRadius = '8px';
    wrapper.style.padding = '12px';
    wrapper.style.margin = '12px 0';
    wrapper.style.position = 'relative';

    // Header con configuración de la sección
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';
    header.style.padding = '6px 8px';
    header.style.backgroundColor = '#f8fafc';
    header.style.borderRadius = '6px';
    header.style.fontSize = '12px';
    header.style.fontWeight = '600';

    const titleLabel = document.createElement('span');
    titleLabel.textContent = '📄 Sección';
    titleLabel.style.color = '#374151';

    // Controles de color y opacidad
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.gap = '8px';
    controlsContainer.style.alignItems = 'center';

    // Selector de color de fondo
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = this.data.customColor || '#ffffff';
    colorPicker.style.width = '32px';
    colorPicker.style.height = '24px';
    colorPicker.style.border = 'none';
    colorPicker.style.borderRadius = '4px';
    colorPicker.style.cursor = 'pointer';
    
    colorPicker.onchange = () => {
      this.data.customColor = colorPicker.value;
      this.data.backgroundColor = 'custom';
      this.updatePreview();
    };

    // Slider de opacidad
    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = '0';
    opacitySlider.max = '1';
    opacitySlider.step = '0.1';
    opacitySlider.value = this.data.opacity || '1';
    opacitySlider.style.width = '60px';
    
    opacitySlider.oninput = () => {
      this.data.opacity = parseFloat(opacitySlider.value);
      this.updatePreview();
    };

    const opacityLabel = document.createElement('span');
    opacityLabel.style.fontSize = '10px';
    opacityLabel.style.color = '#6b7280';
    opacityLabel.textContent = `${Math.round((this.data.opacity || 1) * 100)}%`;
    
    opacitySlider.oninput = () => {
      this.data.opacity = parseFloat(opacitySlider.value);
      opacityLabel.textContent = `${Math.round(this.data.opacity * 100)}%`;
      this.updatePreview();
    };

    controlsContainer.appendChild(colorPicker);
    controlsContainer.appendChild(opacitySlider);
    controlsContainer.appendChild(opacityLabel);

    header.appendChild(titleLabel);
    header.appendChild(controlsContainer);



    // Contenedor para el editor anidado
    const nestedHolder = document.createElement('div');
    nestedHolder.style.minHeight = '40px';
    nestedHolder.style.border = '1px solid #e5e7eb';
    nestedHolder.style.borderRadius = '6px';
    nestedHolder.style.padding = '8px';
    nestedHolder.style.backgroundColor = '#ffffff';

    wrapper.appendChild(header);
    wrapper.appendChild(nestedHolder);

    this.wrapper = wrapper;
    this.updatePreview();

    // Inicializar EditorJS anidado
    this.initializeNestedEditor(nestedHolder);

    return wrapper;
  }

  initializeNestedEditor(holder) {
    // Para simplicidad, mostraremos un placeholder que explique cómo usar la sección
    holder.innerHTML = `
      <div style="
        padding: 20px; 
        text-align: center; 
        color: #6b7280; 
        font-size: 14px;
        line-height: 1.5;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
      ">
        <p style="margin: 0 0 8px; font-weight: 600;">📄 Bloque de Sección</p>
        <p style="margin: 0; font-size: 12px;">
          Este bloque agrupa contenido y aplica el color de fondo seleccionado.<br>
          <strong>Agrega más bloques después de este</strong> para incluirlos en la sección.
        </p>
      </div>
    `;
  }

  updatePreview() {
    if (!this.wrapper) return;
    
    // Aplicar color y opacidad personalizados
    const color = this.data.customColor || '#ffffff';
    const opacity = this.data.opacity || 1;
    
    // Convertir hex a rgba para aplicar opacidad
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    this.wrapper.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  save() {
    return {
      backgroundColor: this.data.backgroundColor,
      customColor: this.data.customColor,
      opacity: this.data.opacity,
      title: this.data.title,
    };
  }

  static get sanitize() {
    return {
      backgroundColor: {},
      title: {},
      blocks: {}
    };
  }
}