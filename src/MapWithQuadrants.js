import React from 'react';
import LastKnownPosition from './LastKnownPosition'; // Importar el componente existente
import './MapWithQuadrants.css'; // Importar los estilos

function MapWithQuadrants() {
    return (
        <div className="map-with-quadrants">
            <LastKnownPosition />
            <div className="quadrants-container">
                <div className="quadrant">Cuadrante 1</div>
                <div className="quadrant">Cuadrante 2</div>
                <div className="quadrant">Cuadrante 3</div>
                <div className="quadrant">Cuadrante 4</div>
            </div>
        </div>
    );
}

export default MapWithQuadrants;
