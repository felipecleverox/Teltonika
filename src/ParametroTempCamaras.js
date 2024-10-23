import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ParametroTempCamaras.css';
import Header from './Header';
import paramTempIcon from './assets/images/param_temp.png';

const ParametroTempCamaras = () => {
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCurrentParams();
  }, []);

  const fetchCurrentParams = async () => {
    try {
      const response = await axios.get('/api1/temperatura-umbrales');
      setMinTemp(response.data.minimo);
      setMaxTemp(response.data.maximo);
    } catch (error) {
      console.error('Error fetching temperature thresholds:', error);
      setMessage('Error al cargar los parámetros actuales');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api1/temperatura-umbrales', { minimo: minTemp, maximo: maxTemp });
      setMessage('Parámetros actualizados exitosamente');
    } catch (error) {
      console.error('Error updating temperature thresholds:', error);
      setMessage('Error al actualizar los parámetros');
    }
  };

  return (
    <div className="parametro-temp-camaras">
      <Header title="Parámetros de Temperatura Cámaras" image={paramTempIcon} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="minTemp">Temperatura Mínima (°C):</label>
            <input
              type="number"
              id="minTemp"
              value={minTemp}
              onChange={(e) => setMinTemp(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="maxTemp">Temperatura Máxima (°C):</label>
            <input
              type="number"
              id="maxTemp"
              value={maxTemp}
              onChange={(e) => setMaxTemp(e.target.value)}
              required
            />
          </div>
          <button type="submit">Actualizar Parámetros</button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default ParametroTempCamaras;