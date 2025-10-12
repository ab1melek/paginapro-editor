export const menuTemplate = {
  pageSettings: {
    layout: 'menu',
    backgroundColor: '#0b0f19',
    containerBackgroundColor: '#111827',
    containerOpacity: 0.98,
    maxWidth: 1024,
  textColor: '#000000',
    accentColor: '#f59e0b',
    primaryColor: '#22c55e'
  },
  blocks: [
    { type: 'header', data: { text: 'La Cocina Paisa', level: 1 }, tunes: { alignment: { alignment: 'center' } } },
    { type: 'paragraph', data: { text: 'Sabores caseros, recetas auténticas y porciones generosas. ¡Bienvenidos!' }, tunes: { alignment: { alignment: 'center' } } },

    // SECCIÓN: Entradas
    { type: 'header', data: { text: 'Entradas', level: 2 } },
    { type: 'list', data: { style: 'unordered', items: [
      'Guacamole con totopos ............ $50',
      'Queso fundido ..................... $65',
      'Queso panela asado ................ $70',
      'Choriqueso ........................ $80'
    ]}},

    // SECCIÓN: Caldo de pollo (con imagen de ejemplo)
    { type: 'header', data: { text: 'Caldo de pollo', level: 2 } },
    { type: 'image', data: { url: 'https://images.unsplash.com/photo-1604908554027-23873d281afe?q=80&w=1200&auto=format&fit=crop', caption: 'Caldo casero' }, tunes: { alignment: { alignment: 'center' } } },
    { type: 'list', data: { style: 'unordered', items: [
      'Con arroz y garbanzo ............. $30',
      'Con arroz, garbanzo y pechuga ..... $55',
      'Con pierna y muslo ................ $45',
      'Con menudencias ................... $50'
    ]}},

    // SECCIÓN: Parrilla
    { type: 'header', data: { text: 'Carne asada', level: 2 } },
    { type: 'columns', data: { ratio: '1:1', blocks: [
      [
        { type: 'list', data: { style: 'unordered', items: [
          'Rib eye .......................... $150',
          'T-bone ............................ $165',
          'Costilla de res ................... $100'
        ] } }
      ],
      [
        { type: 'list', data: { style: 'unordered', items: [
          'Arrachera especial ................ $130',
          'Pechuga a la parrilla ............. $120'
        ] } }
      ]
    ]}},

    // SECCIÓN: Antojitos
    { type: 'header', data: { text: 'Antojitos', level: 2 } },
    { type: 'list', data: { style: 'unordered', items: [
      'Flautas de res (4 pzas) .......... $70',
      'Enchiladas verdes (4 pzas) ....... $85',
      'Enchiladas rojas (4 pzas) ........ $85',
      'Enfrijoladas (4 pzas) ............ $70',
      'Pechuga empanizada ............... $90'
    ]}},

    // SECCIÓN: Guarniciones y Bebidas (dos columnas)
    { type: 'columns', data: { ratio: '1:1', blocks: [
      [
        { type: 'header', data: { text: 'Guarniciones', level: 2 } },
        { type: 'list', data: { style: 'unordered', items: [
          'Arroz rojo o blanco .............. $30',
          'Frijoles de olla ................. $25',
          'Nopales asados ................... $35'
        ] } }
      ],
      [
        { type: 'header', data: { text: 'Bebidas', level: 2 } },
        { type: 'list', data: { style: 'unordered', items: [
          'Refresco 600 ml. ................. $25',
          'Agua fresca del día .............. $25',
          'Limonada o naranjada ............. $30'
        ] } }
      ]
    ]}},

    { type: 'paragraph', data: { text: 'Horario de atención: 9:00 a 22:00 · WiFi: 123456789' }, tunes: { alignment: { alignment: 'center' } } }
  ]
};
