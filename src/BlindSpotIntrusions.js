import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import './BlindSpotIntrusions.css';
import Header from './Header';

registerLocale('es', es);

const BlindSpotIntrusions = () => {
  const [intrusions, setIntrusions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const today = useRef(new Date());

  useEffect(() => {
    fetchIntrusions();
  }, [selectedDate]);

  const fetchIntrusions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/blind-spot-intrusions', {
        params: {
          date: moment(selectedDate).format('YYYY-MM-DD')
        }
      });
      const sortedIntrusions = response.data.sort((a, b) => 
        moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf()
      );
      setIntrusions(sortedIntrusions);
    } catch (error) {
      console.error('Error fetching intrusions:', error);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    if (date <= today.current) {
      setSelectedDate(date);
    } else {
      alert("No se puede seleccionar una fecha futura.");
    }
  };

  const handleWatchVideo = (intrusionId) => {
    setCurrentVideoId(currentVideoId === intrusionId ? null : intrusionId);
  };

  if (loading) {
    return <div>Cargando datos...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="blind-spot-intrusions">
      <Header title="Intrusiones Blind Spot" />
      <div className="date-picker-container">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="dd-MM-yyyy"
          className="date-picker"
          locale="es"
          maxDate={today.current}
        />
        <button onClick={fetchIntrusions}>Buscar</button>
      </div>
      <table className="intrusions-table">
        <thead>
          <tr>
            <th>Sector</th>
            <th>Persona</th>
            <th>Timestamp Intrusión</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {intrusions.map((intrusion, index) => (
            <React.Fragment key={intrusion.id}>
              <tr>
                <td>{intrusion.device_asignado || 'Desconocido'}</td>
                <td>{intrusion.ubicacion || 'Desconocido'}</td>
                <td>{intrusion.timestamp}</td>
                <td>
                <button 
                    onClick={() => handleWatchVideo(intrusion.id)}
                    className={currentVideoId === intrusion.id ? 'close-video-button' : ''}
                  >
                    {currentVideoId === intrusion.id ? 'Cerrar Video' : 'Ver Video'}
                  </button>
                </td>
              </tr>
              {currentVideoId === intrusion.id && (
                <tr className="video-row">
                  <td colSpan="4">
                    <div className="video-player">
                      <video src={`/api/incidencia-video/${intrusion.id}`} controls width="640" height="480">
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BlindSpotIntrusions;