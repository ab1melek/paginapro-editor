/**
 * ColorButtonTool
 * Variante ligera del plugin de botón que permite elegir color de fondo y color de texto.
 * Guarda en JSON: { text, link, bgColor, textColor, align }
 */
export default class ColorButtonTool {
  static get toolbox() {
    return {
      title: 'Botón',
      icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect><path d="M6 7V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2"/></svg>'
    }
  }

  constructor({ data, api }) {
    this.api = api;
    this.data = {
      text: data.text || 'Haz clic',
      link: data.link || '#',
      bgColor: data.bgColor || '#3490dc',
      textColor: data.textColor || '#ffffff',
      align: data.align || 'left'
    };
  }

  render() {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('ce-color-button-wrapper');
    this.wrapper.style.textAlign = this.data.align;

    this.button = document.createElement('a');
    this.button.classList.add('btn');
    this.applyColors();
    this.button.href = this.data.link || '#';
    this.button.target = '_self';
    this.button.contentEditable = true;
    this.button.innerText = this.data.text;

    this.button.addEventListener('blur', () => {
      this.data.text = this.button.innerText.trim() || 'Botón';
    });
    this.button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.button.blur(); }
    });

    this.wrapper.appendChild(this.button);
    return this.wrapper;
  }

  applyColors() {
    if (!this.button) return;
    this.button.style.background = this.data.bgColor;
    this.button.style.color = this.data.textColor;
  }

  renderSettings() {
    const holder = document.createElement('div');
    holder.classList.add('ce-color-button-settings');

    // URL
    holder.appendChild(this._labeledInput('URL', this.data.link, (val)=>{ this.data.link = val; this.button.href = val || '#'; }));
    // Fondo
    holder.appendChild(this._colorPicker('Fondo', this.data.bgColor, (val)=>{ this.data.bgColor = val; this.applyColors(); }));
    // Texto
    holder.appendChild(this._colorPicker('Texto', this.data.textColor, (val)=>{ this.data.textColor = val; this.applyColors(); }));
    // Alineación
    holder.appendChild(this._alignmentButtons());

    return holder;
  }

  _labeledInput(label, value, onChange) {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '8px';
    const lab = document.createElement('label');
    lab.style.display = 'block';
    lab.style.fontSize = '12px';
    lab.style.opacity = '.7';
    lab.innerText = label;
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = value;
    inp.style.width = '100%';
    inp.style.boxSizing = 'border-box';
    inp.addEventListener('input', e => onChange(e.target.value));
    wrap.appendChild(lab); wrap.appendChild(inp);
    return wrap;
  }

  _colorPicker(label, value, onChange) {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '8px';
    const lab = document.createElement('label');
    lab.style.display = 'block';
    lab.style.fontSize = '12px';
    lab.style.opacity = '.7';
    lab.innerText = label;
    const inp = document.createElement('input');
    inp.type = 'color';
    inp.value = value;
    inp.addEventListener('input', e => onChange(e.target.value));
    wrap.appendChild(lab); wrap.appendChild(inp);
    return wrap;
  }

  _alignmentButtons() {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '6px';
    wrap.style.marginTop = '6px';

    const createBtn = (val, svg) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = svg;
      b.style.border = '1px solid #ddd';
      b.style.background = this.data.align === val ? '#eee' : '#fff';
      b.style.cursor = 'pointer';
      b.style.borderRadius = '4px';
      b.style.padding = '4px 6px';
      b.addEventListener('click', ()=>{ this.data.align = val; this.wrapper.style.textAlign = val; [...wrap.children].forEach(c=> c.style.background='#fff'); b.style.background='#eee'; });
      return b;
    };

    wrap.appendChild(createBtn('left', '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/></svg>'));
    wrap.appendChild(createBtn('center', '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/></svg>'));
    wrap.appendChild(createBtn('right', '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/></svg>'));

    return wrap;
  }

  save() {
    return { ...this.data };
  }
}
