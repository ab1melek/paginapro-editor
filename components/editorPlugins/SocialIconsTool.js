// Herramienta simple para Editor.js que permite definir una lista de URLs de redes sociales
// Guarda datos en el bloque: { icons: [{ url }...], size, fgColor, bgColor, alignment }

export default class SocialIconsTool {
  static get toolbox() {
    return {
      title: 'Redes Sociales',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c5.522 0 10-4.477 10-10S17.522 2 12 2Zm4.5 6.007c1.474 0 2.367.893 2.367 2.368c0 1.474-.893 2.374-2.367 2.374c-1.475 0-2.368-.9-2.368-2.374c0-1.475.893-2.368 2.368-2.368ZM7.5 8.007c1.475 0 2.368.893 2.368 2.368c0 1.474-.893 2.374-2.368 2.374c-1.474 0-2.367-.9-2.367-2.374c0-1.475.893-2.368 2.367-2.368Zm0 6.168c1.849 0 3.507.867 4.4 2.177c-1.043.948-2.443 1.548-3.968 1.548c-1.525 0-2.925-.6-3.96-1.548c.882-1.31 2.554-2.177 3.528-2.177Zm7.624 0c1.974 0 3.874.95 4.874 2.425c-1 .999-2.375 1.599-3.875 1.599s-2.875-.6-3.875-1.599c1-1.475 2.9-2.425 2.876-2.425Z"/></svg>'
    };
  }

  constructor({ data, api }) {
    this.api = api;
    this.data = {
      icons: Array.isArray(data?.icons) && data.icons.length ? data.icons : [
        { url: 'https://twitter.com/username' },
        { url: 'https://instagram.com/username' }
      ],
      // size stored as numeric in data for renderer, but UI exposes options: small/medium/large
      size: typeof data?.size === 'number' ? data.size : 40,
      fgColor: data?.fgColor || '#ffffff',
      bgColor: data?.bgColor,
      alignment: data?.alignment || 'center'
    };
    this.wrapper = null;
  }

  render() {
    const w = document.createElement('div');
    w.style.border = '1px dashed #ddd';
    w.style.borderRadius = '6px';
    w.style.padding = '12px';
    w.style.background = '#fafafa';
    w.style.margin = '8px 0';

    const title = document.createElement('div');
    title.textContent = 'Iconos sociales';
    title.style.fontSize = '12px';
    title.style.fontWeight = '600';
    title.style.marginBottom = '8px';
    w.appendChild(title);

    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gap = '6px';
    const preview = document.createElement('div');
    preview.style.marginTop = '10px';
    preview.style.paddingTop = '8px';
    preview.style.borderTop = '1px dashed #e5e7eb';
    const renderPreview = () => {
      try {
        preview.innerHTML = '';
        const container = document.createElement('div');
        container.style.textAlign = this.data.alignment || 'center';
        const row = document.createElement('div');
        row.style.display = 'inline-flex'; row.style.gap = '8px'; row.style.alignItems = 'center';
        const size = typeof this.data.size === 'number' ? this.data.size : 40;
        const icons = Array.isArray(this.data.icons) ? this.data.icons.filter(i => i?.url) : [];
        icons.forEach(ic => {
          let domain = '';
          try { const u = new URL(ic.url); domain = u.hostname.replace('www.',''); } catch {}
          const img = document.createElement('img');
          img.src = domain ? `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(domain)}` : '';
          img.width = size; img.height = size; img.loading = 'lazy';
          img.style.width = `${size}px`; img.style.height = `${size}px`;
          img.style.borderRadius = '50%'; img.style.display='block';
          img.style.background = ic.bgColor || this.data.bgColor || 'transparent';
          img.style.padding = '4px';
          const wrap = document.createElement('div'); wrap.style.display='inline-block'; wrap.appendChild(img);
          row.appendChild(wrap);
        });
        container.appendChild(row); preview.appendChild(container);
      } catch {}
    };
    const renderList = () => {
      list.innerHTML = '';
      this.data.icons.forEach((icon, idx) => {
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '1fr auto';
        row.style.gap = '8px';
        const input = document.createElement('input');
        input.type = 'url';
        input.value = icon.url || '';
        input.placeholder = 'https://...';
        input.style.width = '100%';
  input.oninput = () => { this.data.icons[idx].url = input.value; renderPreview(); };
        const del = document.createElement('button');
        del.textContent = 'Quitar';
        del.style.background = '#e11d48';
        del.style.color = '#fff';
        del.style.border = 'none';
        del.style.borderRadius = '4px';
        del.style.padding = '6px 10px';
        del.onclick = () => {
          this.data.icons.splice(idx, 1);
          renderList(); renderPreview();
        };
        row.appendChild(input);
        row.appendChild(del);
        list.appendChild(row);
      });
    };
    renderList();
    w.appendChild(list);

    const addBtn = document.createElement('button');
    addBtn.textContent = 'Agregar enlace';
    addBtn.style.marginTop = '8px';
  addBtn.onclick = () => { this.data.icons.push({ url: '' }); renderList(); renderPreview(); };
    w.appendChild(addBtn);

    // Ajustes rápidos
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '12px';
  controls.style.marginTop = '12px';
  controls.style.alignItems = 'center';

    // Size options: small / medium / large (mapped to numeric sizes for renderer)
  const sizeWrap = document.createElement('div');
    sizeWrap.style.display = 'grid'; sizeWrap.style.gap = '6px';
    const sizeLabel = document.createElement('div'); sizeLabel.textContent = 'Tamaño'; sizeLabel.style.fontSize='12px';
    const sizeBtns = document.createElement('div'); sizeBtns.style.display='flex'; sizeBtns.style.gap='6px';
    const sizeOptions = [ { key: 'small', label: 'Pequeño', px: 28 }, { key: 'medium', label: 'Medio', px: 40 }, { key: 'large', label: 'Grande', px: 56 } ];
    const currentSizeKey = () => {
      const s = Number(this.data.size || 40);
      const found = sizeOptions.find(o => o.px === s);
      return found ? found.key : (s <= 32 ? 'small' : s <= 48 ? 'medium' : 'large');
    };
    const renderSizeButtons = () => {
      sizeBtns.innerHTML = '';
      const cur = currentSizeKey();
      sizeOptions.forEach(opt => {
        const b = document.createElement('button');
        b.type='button'; b.textContent = opt.label; b.style.padding='6px 10px'; b.style.borderRadius='6px';
        b.style.border = cur === opt.key ? '1px solid #2563eb' : '1px solid #e5e7eb';
        b.style.background = cur === opt.key ? '#2563eb' : '#fff';
        b.style.color = cur === opt.key ? '#fff' : '#111827';
        b.onclick = () => { this.data.size = opt.px; renderSizeButtons(); renderPreview(); };
        sizeBtns.appendChild(b);
      });
    };
    renderSizeButtons();
    sizeWrap.appendChild(sizeLabel); sizeWrap.appendChild(sizeBtns);
    controls.appendChild(sizeWrap);

    const bgWrap = document.createElement('div'); bgWrap.style.display='grid'; bgWrap.style.gap='6px';
    const bgLabel = document.createElement('div'); bgLabel.textContent='Fondo icono'; bgLabel.style.fontSize='12px';
    const bgRow = document.createElement('div'); bgRow.style.display='flex'; bgRow.style.gap='8px'; bgRow.style.alignItems='center';
    const bgInput = document.createElement('input'); bgInput.type='color'; bgInput.value = this.data.bgColor || '#000000';
    bgInput.oninput = () => { this.data.bgColor = bgInput.value; renderPreview(); };
    const noBg = document.createElement('label'); noBg.style.display='inline-flex'; noBg.style.alignItems='center'; noBg.style.gap='6px';
    const noBgChk = document.createElement('input'); noBgChk.type='checkbox'; noBgChk.checked = !this.data.bgColor;
    const noBgTxt = document.createElement('span'); noBgTxt.textContent='Sin fondo'; noBgTxt.style.fontSize='12px';
    const syncNoBgUI = () => { bgInput.disabled = noBgChk.checked; };
    syncNoBgUI();
    noBgChk.onchange = () => {
      if (noBgChk.checked) { this.data.bgColor = ''; }
      else { this.data.bgColor = bgInput.value || '#000000'; }
      syncNoBgUI(); renderPreview();
    };
    noBg.appendChild(noBgChk); noBg.appendChild(noBgTxt);
    bgRow.appendChild(bgInput); bgRow.appendChild(noBg);
    bgWrap.appendChild(bgLabel); bgWrap.appendChild(bgRow);
    controls.appendChild(bgWrap);

    // Alignment buttons (icons)
    const alignWrap = document.createElement('div'); alignWrap.style.display='grid'; alignWrap.style.gap='6px';
    const alignLabel = document.createElement('div'); alignLabel.textContent='Alineación'; alignLabel.style.fontSize='12px';
    const alignBtns = document.createElement('div'); alignBtns.style.display='flex'; alignBtns.style.gap='6px';
    const alignOptions = [ { key: 'left', svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="6" height="16" rx="1" fill="currentColor"/><rect x="11" y="7" width="10" height="10" rx="1" fill="currentColor"/></svg>' }, { key: 'center', svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="6" rx="1" fill="currentColor"/><rect x="6" y="12" width="12" height="6" rx="1" fill="currentColor"/></svg>' }, { key: 'right', svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="4" width="10" height="16" rx="1" fill="currentColor"/><rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor"/></svg>' } ];
    const renderAlignButtons = () => {
      alignBtns.innerHTML = '';
      alignOptions.forEach(opt => {
        const b = document.createElement('button'); b.type='button'; b.style.padding='6px'; b.style.borderRadius='6px'; b.style.border = this.data.alignment === opt.key ? '1px solid #2563eb' : '1px solid #e5e7eb';
        b.style.background = this.data.alignment === opt.key ? '#2563eb' : '#fff'; b.style.color = this.data.alignment === opt.key ? '#fff' : '#111827';
        b.innerHTML = opt.svg;
        b.onclick = () => { this.data.alignment = opt.key; renderAlignButtons(); renderPreview(); };
        alignBtns.appendChild(b);
      });
    };
    renderAlignButtons();
    alignWrap.appendChild(alignLabel); alignWrap.appendChild(alignBtns);
    controls.appendChild(alignWrap);

  w.appendChild(controls);
  renderPreview();
  w.appendChild(preview);

    this.wrapper = w;
    return w;
  }

  save() {
    // Limpieza mínima
    const icons = (this.data.icons || []).map(i => ({ url: (i.url || '').trim() })).filter(i => i.url);
    // Asegurar que size queda en número (ya gestionado por botones) y que alignment está en left/center/right
    return {
      icons,
      size: typeof this.data.size === 'number' ? this.data.size : 40,
      // fgColor ya no se edita; si venía desde datos antiguos se conserva, pero no es obligatorio
      ...(this.data.fgColor ? { fgColor: this.data.fgColor } : {}),
      bgColor: this.data.bgColor,
      alignment: ['left','center','right'].includes(this.data.alignment) ? this.data.alignment : 'center'
    };
  }
}
