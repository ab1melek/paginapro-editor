import { linktreeTemplate } from './linktree';
import { paginaproTemplate } from './paginapro';

export const templates = [
  { id: 'linktree', name: 'LinkTree', description: 'Lista de enlaces y redes', thumbnail: '/templates/linktree.png', data: linktreeTemplate },
  { id: 'paginapro', name: 'PaginaPro Landing', description: 'Landing profesional inspirada en PaginaPro.mx', thumbnail: '/templates/paginapro.png', data: paginaproTemplate },
];
