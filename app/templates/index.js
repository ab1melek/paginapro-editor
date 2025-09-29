import { defaultTemplate } from './default';
import { landingTemplate } from './landing';
import { linktreeTemplate } from './linktree';

export const templates = [
  { id: 'default', name: 'Página estándar', description: 'Estructura simple para contenido', thumbnail: '/templates/default.png', data: defaultTemplate },
  { id: 'landing', name: 'Landing Page', description: 'Optimizada para conversión', thumbnail: '/templates/landing.png', data: landingTemplate },
  { id: 'linktree', name: 'LinkTree', description: 'Lista de enlaces y redes', thumbnail: '/templates/linktree.png', data: linktreeTemplate },
];
