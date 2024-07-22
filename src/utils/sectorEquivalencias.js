// utils/sectorEquivalencias.js

const sectorEquivalencias = {
    'E/S Bodega': 'Frio 1',
    'Farmacia': 'Maquila 1',
    'Entrada': 'Entrada Principal',
    'Pasillo Central': 'Bodega 7',
    'Electro': 'Bodega 15'
  };
  
  export function obtenerEquivalenciaSector(sectorOriginal) {
    return sectorEquivalencias[sectorOriginal] || sectorOriginal;
  }
  
  export default sectorEquivalencias;