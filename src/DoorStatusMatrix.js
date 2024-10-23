import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area } from 'recharts';
import "react-datepicker/dist/react-datepicker.css";
import './DoorStatusMatrix.css';
import Header from './Header';
import dayjs from 'dayjs';

const DoorStatusMatrix = () => {
  const [data, setData] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pieChartData, setPieChartData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [selectedInterval, setSelectedInterval] = useState({ start: dayjs().set('hour', 8).set('minute', 0), end: dayjs().set('hour', 9).set('minute', 0) });
  const LINE_COLOR = '#8A2BE2';  // Violeta para la línea del gráfico
  const DOOR_OPEN_COLOR = '#26b43bcf';  // Verde para puerta abierta
  const DOOR_CLOSED_COLOR = '#af4c4f';  // Rojo para puerta cerrada
  const COLORS = [DOOR_OPEN_COLOR, DOOR_CLOSED_COLOR];

  useEffect(() => {
    fetchDataForSelectedDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (data.length > 0) {
      const startDate = dayjs(selectedDate).set('hour', selectedInterval.start.hour()).set('minute', selectedInterval.start.minute());
      const endDate = dayjs(selectedDate).set('hour', selectedInterval.end.hour()).set('minute', selectedInterval.end.minute());
      processLineChartData(data, startDate, endDate);
    }
  }, [selectedInterval, data, selectedDate]);

  const fetchDataForSelectedDate = async (date) => {
    const startDate = dayjs(date).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endDate = dayjs(date).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    try {
      const response = await axios.get('/api1/door-status', {
        params: { startDate, endDate }
      });
      const fetchedData = response.data;
      console.log('Fetched data:', fetchedData);

      const uniqueSectors = [...new Set(fetchedData.map(item => item.sector))];
      setSectors(uniqueSectors);
      setData(fetchedData);

      processChartData(fetchedData);
      setSelectedInterval({
        start: dayjs(date).set('hour', 8).set('minute', 0),
        end: dayjs(date).set('hour', 8).set('minute', 30)
      });
    } catch (error) {
      console.error('Error fetching door status:', error);
    }
  };

  const processChartData = (fetchedData) => {
    const openCount = fetchedData.filter(d => d.magnet_status === 0).length;
    const closedCount = fetchedData.filter(d => d.magnet_status === 1).length;
    const total = openCount + closedCount;
    setPieChartData([
      { name: 'Abierto', value: openCount, percentage: ((openCount / total) * 100).toFixed(2) },
      { name: 'Cerrado', value: closedCount, percentage: ((closedCount / total) * 100).toFixed(2) }
    ]);
  };

  const processLineChartData = (fetchedData, startDate, endDate) => {
    const chartData = [];
    let currentTime = dayjs(startDate);
    const endTime = dayjs(endDate);

    const relevantData = fetchedData.filter(d => {
      const timestamp = dayjs(d.timestamp);
      return timestamp.isAfter(startDate) && timestamp.isBefore(endTime);
    });

    relevantData.sort((a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf());

    while (currentTime.isBefore(endTime) || currentTime.isSame(endTime)) {
      const entry = relevantData.find(d => dayjs(d.timestamp).isSame(currentTime, 'minute'));
      const status = entry ? (entry.magnet_status === 0 ? 2 : 1) : null;

      if (status !== null) {
        chartData.push({ time: currentTime.format('HH:mm'), status });
      }

      currentTime = currentTime.add(1, 'minute');
    }

    setLineChartData(chartData);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleCellClick = (hour, minute) => {
    const start = dayjs(selectedDate).set('hour', hour).set('minute', minute);
    const end = start.add(10, 'minute');
    setSelectedInterval({ start, end });
  };

  const getColorClass = (status) => {
    return status === 1 ? 'closed' : 'open';
  };

  const createMatrix = () => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 8);
    const minuteRanges = ['10:00', '00:20', '00:30', '00:40', '00:50', '00:59'];

    return sectors.map(sector => {
      const sectorData = data.filter(d => d.sector === sector);
      return (
        <tr key={sector}>
          <td>{sector}</td>
          <td>
            <table className="inner-table">
              <tbody>
                {minuteRanges.map((range, index) => (
                  <tr key={index}>
                    <td className="minute-label">{range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
          {hours.map(hour => (
            <td key={hour}>
              <table className="inner-table">
                <tbody>
                  {minuteRanges.map((_, minuteIndex) => {
                    const startMinute = minuteIndex * 10;
                    const endMinute = startMinute + 10;
                    const trameData = sectorData.filter(d => {
                      const entryTime = dayjs(d.timestamp);
                      return entryTime.hour() === hour && 
                             entryTime.minute() >= startMinute && 
                             entryTime.minute() < endMinute;
                    });
                    const lastEntry = trameData.length > 0 ? 
                      trameData.reduce((prev, current) => (dayjs(current.timestamp).isAfter(dayjs(prev.timestamp)) ? current : prev)) 
                      : null;
                    return (
                      <tr key={minuteIndex}>
                        <td 
                          className="clickable-cell" 
                          onClick={() => handleCellClick(hour, startMinute)}
                        >
                          {lastEntry && (
                            <div className={`temperature ${getColorClass(lastEntry.magnet_status)}`}>
                              {Math.round(lastEntry.temperature)}°C
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </td>
          ))}
        </tr>
      );
    });
  };

  const matrix = createMatrix();

  return (
    <div className="door-status-matrix">
      <Header />
      <h1>Estado de Puertas por Sector</h1>
      <h3 style={{ textAlign: 'center' }}>al término de cada tramo de tiempo</h3>
      <div className="controls">
        <DatePicker 
          selected={selectedDate} 
          onChange={handleDateChange} 
          dateFormat="yyyy-MM-dd"
          className="date-picker"
        />
        <div className="legends">
          <div className="legend">
            <div className="color-box open"></div>
            <span>Puerta Abierta</span>
          </div>
          <div className="legend">
            <div className="color-box closed"></div>
            <span>Puerta Cerrada</span>
          </div>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="col-sector">Sector</th>
              <th className="col-minutes">Minutos hasta</th>
              {Array.from({ length: 16 }, (_, i) => (
                <th key={i} className="col-width">{`${(i + 8).toString().padStart(2, '0')}:00`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix}
          </tbody>
        </table>
      </div>
      <div className="charts-wrapper">
        <div className="chart">
          <h2>Resumen de Estados</h2>
          <PieChart width={400} height={300}>
            <Pie
              data={pieChartData}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percentage }) => `${name}: ${percentage}%`}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
        <div className="chart">
          <h2>Estado de la Puerta del Tramo de Tiempo</h2>
          <h3 style={{ textAlign: 'center' }}>Escoja tramo en la matríz</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="time" 
                interval="preserveStartEnd"
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#666' }}
                tickLine={{ stroke: '#666' }}
              />
              <YAxis 
                tickFormatter={(value) => (value === 2 ? 'Abierto' : value === 1 ? 'Cerrado' : '')}
                domain={[0.5, 2.5]}
                ticks={[1, 2]}
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#666' }}
                tickLine={{ stroke: '#666' }}
              />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
                      <p>{`Tiempo: ${data.time}`}</p>
                      <p style={{ color: data.status === 2 ? DOOR_OPEN_COLOR : DOOR_CLOSED_COLOR }}>
                        {`Estado: ${data.status === 2 ? 'Abierto' : 'Cerrado'}`}
                      </p>
                    </div>
                  );
                }
                return null;
              }} />
              <Legend content={() => (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <div style={{ marginRight: '20px' }}>
                    <span style={{ color: DOOR_OPEN_COLOR, marginRight: '5px' }}>●</span>
                    Abierto
                  </div>
                  <div>
                    <span style={{ color: DOOR_CLOSED_COLOR, marginRight: '5px' }}>●</span>
                    Cerrado
                  </div>
                </div>
              )} />
              <Line 
                type="stepAfter" 
                dataKey="status" 
                stroke={LINE_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: LINE_COLOR }}
              />
              <Area type="stepAfter" dataKey="status" stroke={LINE_COLOR} fill={LINE_COLOR} fillOpacity={0.3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DoorStatusMatrix;