export const paginaproTemplate = {
  pageSettings: {
    layout: 'landing',
    backgroundColor: '#0f172a', // Azul marino oscuro profesional
    containerBackgroundColor: '#ffffff',
    containerOpacity: 1,
    maxWidth: 1200,
    primaryColor: '#3b82f6', // Azul moderno
    accentColor: '#10b981', // Verde success
    textColor: '#1e293b',
    heroBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  blocks: [
    // HERO SECTION - Principal con CTA
    {
      type: 'hero',
      data: {
        align: 'center',
        bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        overlayColor: '#1e40af',
        overlayOpacity: 0.15,
        paddingTop: 100,
        paddingBottom: 80,
        blocks: [
          { 
            type: 'header', 
            data: { text: 'Tu Presencia Digital Profesional', level: 1 }, 
            tunes: { alignment: { alignment: 'center' } } 
          },
          { 
            type: 'header', 
            data: { text: 'Desde $149 MXN al mes', level: 2 }, 
            tunes: { alignment: { alignment: 'center' } } 
          },
          { 
            type: 'paragraph', 
            data: { text: 'Especialistas en crear páginas web profesionales que impulsan tu negocio. Solución completa que incluye diseño personalizado, página "Mis Links", código QR y soporte 24/7.' }, 
            tunes: { alignment: { alignment: 'center' } } 
          },
          { 
            type: 'button', 
            data: { 
              text: '🚀 Ver Planes y Precios', 
              link: '#planes', 
              bgColor: '#10b981', 
              textColor: '#ffffff', 
              align: 'center' 
            } 
          },
        ]
      }
    },

    // SECCIÓN DE BENEFICIOS - ¿Por qué elegir Página Pro?
    {
      type: 'header',
      data: { text: '¿Por qué elegir Página Pro MX?', level: 2 },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'columns',
      data: {
        ratio: '1:1',
        blocks: [
          [
            { type: 'header', data: { text: '🎯 Especialistas Certificados', level: 3 } },
            { type: 'paragraph', data: { text: 'Equipo de desarrolladores y diseñadores con +5 años de experiencia creando páginas web que convierten visitantes en clientes.' } },
            { type: 'header', data: { text: '🌐 Solución Todo-en-Uno', level: 3 } },
            { type: 'paragraph', data: { text: 'Página web profesional + Página "Mis Links" + Hosting + Dominio + SSL + Soporte técnico. Todo incluido en un solo precio.' } },
            { type: 'header', data: { text: '📱 Código QR Digital', level: 3 } },
            { type: 'paragraph', data: { text: 'Código QR personalizado con tu logo que conecta directamente con tu página. Perfecto para tarjetas de presentación y marketing offline.' } }
          ],
          [
            { type: 'header', data: { text: '� Precio Fijo Sin Sorpresas', level: 3 } },
            { type: 'paragraph', data: { text: 'Sin cobros ocultos, renovaciones caras o gastos extras. Un precio fijo que incluye todo lo necesario para tu éxito digital.' } },
            { type: 'header', data: { text: '� Servicio Llave en Mano', level: 3 } },
            { type: 'paragraph', data: { text: 'Desde la consulta inicial hasta el lanzamiento y mantenimiento. Solo enfócate en tu negocio, nosotros manejamos la tecnología.' } },
            { type: 'header', data: { text: '🚀 Respuesta Inmediata', level: 3 } },
            { type: 'paragraph', data: { text: 'Soporte técnico profesional vía WhatsApp con tiempo de respuesta menor a 2 horas en horario laboral.' } }
          ]
        ]
      }
    },

    // ATENCIÓN PERSONALIZADA
    {
      type: 'header',
      data: { text: 'Atención Personalizada 24/7', level: 2 },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'paragraph',
      data: { text: 'Nuestro equipo está disponible en todo momento para resolver tus dudas y mantener tu página web siempre actualizada. ¡Contrata ahora y recibe soporte técnico inmediato!' },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'columns',
      data: {
        ratio: '1:1',
        blocks: [
          [
            { 
              type: 'button', 
              data: { 
                text: 'Contratar Ahora', 
                link: 'https://wa.me/524622222741?text=Quiero%20contratar%20mi%20p%C3%A1gina%20web%20y%20crecer%20mi%20negocio%2C%20%C2%BFcu%C3%A1les%20son%20los%20siguientes%20pasos%3F', 
                bgColor: '#10b981', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ],
          [
            { 
              type: 'button', 
              data: { 
                text: 'Más Información vía WhatsApp', 
                link: 'https://wa.me/524622222741?text=Hola%2C%20quiero%20m%C3%A1s%20info', 
                bgColor: '#3b82f6', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ]
        ]
      }
    },

    // NUESTROS PLANES
    {
      type: 'header',
      data: { text: 'Nuestros Planes', level: 2 },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'paragraph',
      data: { text: 'Elige el plan que mejor se adapte a tus necesidades. Todos incluyen diseño profesional, soporte técnico y atención 24/7.' },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'columns',
      data: {
        ratio: '1:1:1',
        blocks: [
          [
            { type: 'header', data: { text: '💼 Plan Mensual', level: 3 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Todo lo que necesitas para tu presencia web profesional' }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'header', data: { text: '$149/mes', level: 2 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: '✅ Página web responsive\n✅ Página "Mis Links" incluida\n✅ Código QR personalizado\n✅ Soporte técnico 24/7\n✅ Actualizaciones ilimitadas\n✅ Certificado SSL gratis\n✅ Hosting premium incluido' } },
            { 
              type: 'button', 
              data: { 
                text: 'Suscribirme Mensual', 
                link: '#', 
                bgColor: '#3b82f6', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ],
          [
            { type: 'header', data: { text: '🎯 Plan Anual', level: 3 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Ahorra pagando por adelantado' }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'header', data: { text: '$129/mes', level: 2 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: '✅ Todo del Plan Mensual\n🎁 2 meses completamente GRATIS\n⚡ Prioridad en soporte técnico\n📊 Análisis de rendimiento mensual\n🎨 Rediseño anual incluido\n📈 Optimización SEO básica\n💡 Consultas estratégicas' } },
            { 
              type: 'button', 
              data: { 
                text: 'Suscribirme Anual', 
                link: '#', 
                bgColor: '#10b981', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ],
          [
            { type: 'header', data: { text: '⭐ Plan Premium', level: 3 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Nuestro plan de consultoría mensual con acompañamiento constante' }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'header', data: { text: '$499/mes', level: 2 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: '✅ Todo del Plan Anual\n👥 Sesiones semanales de 20 minutos\n📈 Estrategias de crecimiento personalizadas\n🔍 Análisis competitivo mensual\n🚀 Optimización continua de conversión\n📱 Gestión de redes sociales básica\n🎯 Marketing digital estratégico' } },
            { 
              type: 'button', 
              data: { 
                text: 'Suscribirme Premium', 
                link: '#', 
                bgColor: '#f59e0b', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ]
        ]
      }
    },

    // CARACTERÍSTICAS TÉCNICAS
    {
      type: 'header',
      data: { text: 'Tecnología de Vanguardia', level: 2 },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'paragraph',
      data: { text: 'Utilizamos las últimas tecnologías para garantizar que tu página web sea rápida, segura y optimizada para motores de búsqueda.' },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'columns',
      data: {
        ratio: '1:1:1:1',
        blocks: [
          [
            { type: 'header', data: { text: '⚡ Velocidad', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Carga en menos de 2 segundos\nOptimización automática de imágenes\nCDN global incluido' }, tunes: { alignment: { alignment: 'center' } } }
          ],
          [
            { type: 'header', data: { text: '📱 Responsive', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Perfecta en móviles\nAdaptable a cualquier pantalla\nDiseño mobile-first' }, tunes: { alignment: { alignment: 'center' } } }
          ],
          [
            { type: 'header', data: { text: '🔒 Seguridad', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Certificado SSL incluido\nBackups automáticos diarios\nProtección anti-malware' }, tunes: { alignment: { alignment: 'center' } } }
          ],
          [
            { type: 'header', data: { text: '🎯 SEO Ready', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Optimizado para Google\nMetatags configurados\nSitemap automático' }, tunes: { alignment: { alignment: 'center' } } }
          ]
        ]
      }
    },

    // MUESTRAS DE TRABAJO
    {
      type: 'header',
      data: { text: 'Muestras de Nuestro Trabajo', level: 2 },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'columns',
      data: {
        ratio: '1:1:1',
        blocks: [
          [
            { type: 'header', data: { text: '🏢 Página Web de Negocio', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Ejemplo de una página web profesional para tu negocio con diseño moderno y funcional.' }, tunes: { alignment: { alignment: 'center' } } },
            { 
              type: 'button', 
              data: { 
                text: 'Ver Ejemplo', 
                link: '#', 
                bgColor: '#6b7280', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ],
          [
            { type: 'header', data: { text: '🔗 Página de Mis Links', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Ejemplo de una página con todos tus enlaces importantes organizados profesionalmente.' }, tunes: { alignment: { alignment: 'center' } } },
            { 
              type: 'button', 
              data: { 
                text: 'Ver Ejemplo', 
                link: '#', 
                bgColor: '#6b7280', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ],
          [
            { type: 'header', data: { text: '🍽️ Menú para Restaurante', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Ejemplo de una página con menú para restaurante y enlaces importantes integrados.' }, tunes: { alignment: { alignment: 'center' } } },
            { 
              type: 'button', 
              data: { 
                text: 'Ver Ejemplo', 
                link: '#', 
                bgColor: '#6b7280', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ]
        ]
      }
    },

    // TESTIMONIOS
    {
      type: 'header',
      data: { text: 'Lo que dicen nuestros clientes', level: 2 },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'columns',
      data: {
        ratio: '1:1:1',
        blocks: [
          [
            { type: 'quote', data: { text: 'Nuestra presencia en línea mejoró significativamente con Página Pro. ¡Excelente servicio!', caption: 'Nostro Café - Cafetería y Distribuidora de Café' } }
          ],
          [
            { type: 'quote', data: { text: 'Increíble atención 24/7. Siempre responden a mis dudas y solicitudes de cambios rápidamente.', caption: 'María González - Boutique de Ropa' } }
          ],
          [
            { type: 'quote', data: { text: 'La mejor inversión para mi negocio. Mi página web quedó profesional y a un precio accesible.', caption: 'Carlos Méndez - Estudio Fotográfico' } }
          ]
        ]
      }
    },

    // CANAL DE YOUTUBE
    {
      type: 'header',
      data: { text: 'Síguenos en YouTube', level: 2 },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'paragraph',
      data: { text: 'Visita nuestro canal para tutoriales y consejos sobre cómo aprovechar al máximo tu página web' },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'button',
      data: {
        text: '📺 Visitar YouTube',
        link: 'https://www.youtube.com/@paginapromx',
        bgColor: '#ef4444',
        textColor: '#ffffff',
        align: 'center'
      }
    },

    // CONTACTO
    {
      type: 'header',
      data: { text: 'Contacto', level: 2 },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'columns',
      data: {
        ratio: '1:1:1',
        blocks: [
          [
            { type: 'header', data: { text: '📱 WhatsApp', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: '462-222-2741' }, tunes: { alignment: { alignment: 'center' } } },
            { 
              type: 'button', 
              data: { 
                text: 'Enviar Mensaje', 
                link: 'https://wa.me/524622222741?text=Hola%2C%20quiero%20m%C3%A1s%20info', 
                bgColor: '#10b981', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ],
          [
            { type: 'header', data: { text: '📧 Email', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'contacto@paginapro.mx' }, tunes: { alignment: { alignment: 'center' } } },
            { 
              type: 'button', 
              data: { 
                text: 'Escribir Email', 
                link: 'mailto:contacto@paginapro.mx', 
                bgColor: '#3b82f6', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ],
          [
            { type: 'header', data: { text: '📍 Ubicación', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Irapuato, Guanajuato, México' }, tunes: { alignment: { alignment: 'center' } } },
            { 
              type: 'button', 
              data: { 
                text: 'Ver Mapa', 
                link: 'https://maps.app.goo.gl/JnQcSG48tbR9dyjz7', 
                bgColor: '#6b7280', 
                textColor: '#ffffff', 
                align: 'center' 
              } 
            }
          ]
        ]
      }
    },

    // GARANTÍA Y COMPROMISO
    {
      type: 'header',
      data: { text: 'Nuestra Garantía', level: 2 },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'columns',
      data: {
        ratio: '1:1:1',
        blocks: [
          [
            { type: 'header', data: { text: '✅ Garantía 30 días', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Si no estás completamente satisfecho, te devolvemos tu dinero sin preguntas.' }, tunes: { alignment: { alignment: 'center' } } }
          ],
          [
            { type: 'header', data: { text: '⚡ Entrega en 48h', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Tu página estará lista y funcionando en máximo 48 horas después de contratar.' }, tunes: { alignment: { alignment: 'center' } } }
          ],
          [
            { type: 'header', data: { text: '🔄 Revisiones ilimitadas', level: 4 }, tunes: { alignment: { alignment: 'center' } } },
            { type: 'paragraph', data: { text: 'Ajustes y cambios sin costo adicional hasta que quedes 100% satisfecho.' }, tunes: { alignment: { alignment: 'center' } } }
          ]
        ]
      }
    },

    // CALL TO ACTION FINAL
    {
      type: 'header',
      data: { text: '¿Listo para llevar tu negocio al siguiente nivel?', level: 2 },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'paragraph',
      data: { text: 'Únete a cientos de empresarios que ya confiaron en nosotros para crear su presencia digital profesional.' },
      tunes: { alignment: { alignment: 'center' } }
    },
    {
      type: 'button',
      data: {
        text: '🚀 Comenzar Ahora - Contáctanos',
        link: 'https://wa.me/524622222741?text=Hola%2C%20quiero%20comenzar%20mi%20página%20web%20profesional',
        bgColor: '#10b981',
        textColor: '#ffffff',
        align: 'center'
      }
    },

    // FOOTER
    {
      type: 'paragraph',
      data: { text: '© 2025 Página Pro MX. Todos los derechos reservados.\nCreando presencia digital profesional desde 2020.' },
      tunes: { alignment: { alignment: 'center' } }
    }
  ]
};
