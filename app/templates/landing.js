export const landingTemplate = {
  pageSettings: {
    layout: 'landing',
    backgroundColor: '#0b1220',
    containerBackgroundColor: '#ffffff',
    containerOpacity: 1,
    maxWidth: 1200,
    primaryColor: '#2563eb',
    accentColor: '#22c55e',
    textColor: '#0f172a',
    heroBackground: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,1))'
  },
  blocks: [
    {
      type: 'hero',
      data: {
        align: 'center',
        bg: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,1))',
        overlayColor: '',
        overlayOpacity: 0,
        blocks: [
          { type: 'header', data: { text: 'Tu producto, mejor que nunca', level: 1 }, tunes: { alignment: { alignment: 'center' } } },
          { type: 'paragraph', data: { text: 'Atrae, convierte y retén clientes con una experiencia impecable.' }, tunes: { alignment: { alignment: 'center' } } },
          { type: 'button', data: { text: 'Comenzar ahora', link: '#', bgColor: '#2563eb', textColor: '#ffffff', align: 'center' } },
        ]
      }
    },
    {
      type: 'columns',
      data: {
        ratio: '1:1:1',
        blocks: [
          [ { type: 'header', data: { text: 'Rápido', level: 3 } }, { type: 'paragraph', data: { text: 'Render cliente/SSR optimizado para SEO y performance.' } } ],
          [ { type: 'header', data: { text: 'Flexible', level: 3 } }, { type: 'paragraph', data: { text: 'Columnas, estilos y bloques personalizables.' } } ],
          [ { type: 'header', data: { text: 'Escalable', level: 3 } }, { type: 'paragraph', data: { text: 'Persistencia en Postgres y APIs REST.' } } ],
        ]
      }
    }
  ]
};
