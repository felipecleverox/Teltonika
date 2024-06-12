import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './DoorStatusMatrix.css';
import Header from './Header';
import dayjs from 'dayjs';

const DoorStatusMatrix = () => {
  const [data, setData] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchDataForSelectedDate(selectedDate);
  }, [selectedDate]);

  const fetchDataForSelectedDate = async (date) => {
    const startDate = dayjs(date).set('hour', 8).set('minute', 0).set('second', 0).format('YYYY-MM-DD HH:mm:ss');
    const endDate = dayjs(date).set('hour', 23).set('minute', 0).set('second', 0).format('YYYY-MM-DD HH:mm:ss');

    try {
      const response = await axios.get('http://thenext.ddns.net:3000/api/door-status', {
        params: { startDate, endDate }
      });
      const fetchedData = response.data;

      // Obtener los sectores únicos
      const uniqueSectors = [...new Set(fetchedData.map(item => item.sector))];
      setSectors(uniqueSectors);
      setData(fetchedData);
    } catch (error) {
      console.error('Error fetching door status:', error);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const getColorClass = (status) => {
    return status === 1 ? 'closed' : 'open'; // Ajustado para usar las clases 'closed' y 'open'
  };

  const createMatrix = () => {
    const hours = Array.from({ length: 16 }, (_, i) => 8 + i); // Horas de 8 a 23
    return sectors.map(sector => {
      const sectorData = data.filter(d => d.sector === sector);
      const rows = hours.map(hour => {
        const hourData = sectorData.filter(d => dayjs(d.timestamp).hour() === hour);
        const cells = Array.from({ length: 6 }, (_, i) => {
          const entry = hourData.find(e => {
            const minutes = dayjs(e.timestamp).minute();
            return minutes >= i * 10 && minutes < (i + 1) * 10;
          });
          if (entry) {
            return (
              <tr key={i}>
                <td className={`temperature ${getColorClass(entry.magnet_status)}`}>
                  {Math.round(entry.temperature)}°C
                </td>
              </tr>
            );
          } else {
            return <tr key={i}><td></td></tr>;
          }
        });
        return <td key={hour}><table><tbody>{cells}</tbody></table></td>;
      });
      return { sector, rows };
    });
  };

  const matrix = createMatrix();

  return (
    <div className="door-status-matrix">
      <Header />
      <h1>Estado de Puertas por Sector</h1>
      <DatePicker 
        selected={selectedDate} 
        onChange={handleDateChange} 
        dateFormat="yyyy-MM-dd"
        className="date-picker"
      />
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="col-sector">Sector</th>
              <th className="col-minutes">Minutos</th>
              {Array.from({ length: 16 }, (_, i) => (
                <th key={i} className="col-width">{`${8 + i}:00`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map(({ sector, rows }) => (
              <tr key={sector}>
                <td>{sector}</td>
                <td className="minute-labels">
                  <table>
                    <tbody>
                      {['00:00', '10:00', '20:00', '30:00', '40:00', '50:00'].map((minute, index) => (
                        <tr key={index}>
                          <td className="minute-label" style={{ color: 'inherit' }}>{minute}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
                {rows}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoorStatusMatrix;
