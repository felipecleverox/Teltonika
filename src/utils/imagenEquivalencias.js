// utils/imagenEquivalencias.js

import forkliftOrange from '../assets/images/forklift_orange.png';
import forkliftBlue from '../assets/images/forklift_blue.png';
import personal3Icon from '../assets/images/Personal 3.png';

const imagenEquivalencias = {
  'Personal 1.png': forkliftOrange,
  'Personal 2.png': forkliftBlue,
  'Personal 3.png': personal3Icon
};

export function obtenerEquivalenciaImagen(imagenOriginal) {
  return imagenEquivalencias[imagenOriginal] || imagenOriginal;
}

export default imagenEquivalencias;