import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Configuration.css';
import Header from './Header';

const Configuration = () => {
  const [sectors, setSectors] = useState([]);
  const [config, setConfig] = useState({
    umbralVerde: '',
    umbralAmarillo: '',
    umbralRojo: '',
  });

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await axios.get('/api/sectores');
        setSectors(response.data);
      } catch (error) {
        console.error('Error fetching sectors:', error);
      }
    };

    const fetchConfiguration = async () => {
      try {
        const response = await axios.get('/api/configuracion');
        const data = response.data.reduce((acc, cur) => {
          acc[`beacon_${cur.beacon_id}_minTiempoPermanencia`] = cur.min_tiempo_permanencia;
          acc[`beacon_${cur.beacon_id}_maxTiempoPermanencia`] = cur.max_tiempo_permanencia;
          acc.umbralVerde = cur.umbral_verde;
          acc.umbralAmarillo = cur.umbral_amarillo;
          acc.umbralRojo = cur.umbral_rojo;
          return acc;
        }, {});
        setConfig(data);
      } catch (error) {
        console.error('Error fetching configuration:', error);
      }
    };

    fetchSectors();
    fetchConfiguration();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const configuraciones = sectors.map(sector => ({
      beacon_id: sector.id,
      min_tiempo_permanencia: config[`beacon_${sector.id}_minTiempoPermanencia`] || 0,
      max_tiempo_permanencia: config[`beacon_${sector.id}_maxTiempoPermanencia`] || 0,
      umbral_verde: config.umbralVerde || 0,
      umbral_amarillo: config.umbralAmarillo || 0,
      umbral_rojo: config.umbralRojo || 0,
    }));

    try {
      await axios.post('/api/configuracion', configuraciones);
      alert('Configuración guardada exitosamente.');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error guardando la configuración.');
    }
  };

  return (
    <div className="configuration">
      <Header title="Configuración" />
      <form onSubmit={handleSubmit} className="configuration-form">
        <h2>Parámetros de Sector</h2>
        {sectors.map((sector, index) => (
          <div key={sector.id}>
            <div className="form-group">
              <label>{sector.nombre} - Tiempo Mínimo de Permanencia (minutos)</label>
              <input 
                type="number"
                name={`beacon_${sector.id}_minTiempoPermanencia`}
                value={config[`beacon_${sector.id}_minTiempoPermanencia`] || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>{sector.nombre} - Tiempo Máximo de Permanencia (minutos)</label>
              <input 
                type="number"
                name={`beacon_${sector.id}_maxTiempoPermanencia`}
                value={config[`beacon_${sector.id}_maxTiempoPermanencia`] || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        ))}
        
        <h2>Umbrales de Semáforo</h2>
        <div className="form-group">
          <label>Umbral Verde (minutos)</label>
          <input 
            type="number"
            name="umbralVerde"
            value={config.umbralVerde}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Umbral Amarillo (minutos)</label>
          <input 
            type="number"
            name="umbralAmarillo"
            value={config.umbralAmarillo}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Umbral Rojo (minutos)</label>
          <input 
            type="number"
            name="umbralRojo"
            value={config.umbralRojo}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="save-button">Guardar Configuración</button>
      </form>
    </div>
  );
};

export default Configuration;
