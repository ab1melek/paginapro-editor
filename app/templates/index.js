import { menuTemplate } from './menu';
import { linktreeTemplate } from './mislinks';
import { paginaproTemplate } from './paginapro';

export const templates = [
  { id: 'mislinks', name: 'MisLinks', description: 'Lista de enlaces y redes', thumbnail: '/templates/linktree.png', data: linktreeTemplate },
  { id: 'paginapro', name: 'PaginaPro Landing', description: 'Landing profesional inspirada en PaginaPro.mx', thumbnail: '/templates/paginapro.png', data: paginaproTemplate },
  { id: 'menu', name: 'Menú Restaurante', description: 'Menú por secciones con estilo atractivo', thumbnail: '/templates/placeholder.png', data: menuTemplate },
];
