export const linktreeTemplate = {
  pageSettings: {
    layout: 'mislinks',
    backgroundColor: '#111827',
    // backgroundImageUrl: '/uploads/blob/your-image.jpg',
    textColor: '#ffffff',
    maxWidth: 560,
  },
  blocks: [
    { type: 'image', data: { url: 'https://placekitten.com/300/300', caption: 'Avatar' }, tunes: { alignment: { alignment: 'center' } } },
    { type: 'header', data: { text: 'Tu Nombre', level: 2 }, tunes: { alignment: { alignment: 'center' } } },
    { type: 'paragraph', data: { text: 'Creador • Desarrollador • Emprendedor' }, tunes: { alignment: { alignment: 'center' } } },
    { type: 'socialIcons', data: { icons: [
      { url: 'https://twitter.com/username' },
      { url: 'https://instagram.com/username' },
      { url: 'https://github.com/username' },
    ], size: 40, fgColor: '#ffffff', alignment: 'center' } },
    { type: 'button', data: { text: 'Mi sitio', link: 'https://example.com', bgColor: '#2563eb', textColor: '#ffffff', align: 'center' } },
    { type: 'button', data: { text: 'YouTube', link: 'https://youtube.com', bgColor: '#dc2626', textColor: '#ffffff', align: 'center' } },
    { type: 'button', data: { text: 'Contacto', link: 'mailto:yo@example.com', bgColor: '#10b981', textColor: '#111827', align: 'center' } },
  ]
};
