export const linktreeTemplate = {
  pageSettings: {
    backgroundColor: '#7c3aed',
    containerBackgroundColor: '#ffffff',
    containerOpacity: 0.97,
    maxWidth: 600
  },
  blocks: [
    { type: 'header', data: { text: 'Tu Nombre', level: 2 }, tunes: { alignment: { alignment: 'center' } } },
    { type: 'paragraph', data: { text: 'Creador • Desarrollador • Emprendedor' }, tunes: { alignment: { alignment: 'center' } } },
    { type: 'socialIcons', data: { icons: [
      { url: 'https://twitter.com/username' },
      { url: 'https://instagram.com/username' },
      { url: 'https://github.com/username' },
    ], size: 40, fgColor: '#ffffff', bgColor: '#7c3aed', alignment: 'center' } },
    { type: 'button', data: { text: 'Mi sitio', link: 'https://example.com', bgColor: '#2563eb', textColor: '#ffffff', align: 'center' } },
    { type: 'button', data: { text: 'YouTube', link: 'https://youtube.com', bgColor: '#dc2626', textColor: '#ffffff', align: 'center' } },
  ]
};
