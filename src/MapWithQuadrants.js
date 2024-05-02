import React from 'react';
import './MapWithQuadrants.css'; // Importar los estilos

function MapWithQuadrants() {
    return (
        <div className="map-with-quadrants">
            <h2>Ubicaciones en Interior</h2>
            <div className="quadrants-container">
                <div className="quadrant">OFICINA 1</div>
                <div className="quadrant">OFICINA 2</div>
                <div className="quadrant">OFICINA 3</div>
                <div className="quadrant">OFICINA 4</div>
            </div>
        </div>
    );
}

export default MapWithQuadrants;
