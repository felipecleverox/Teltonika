import React, { useState, useEffect } from 'react';

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000); // Actualizar cada segundo

    return () => clearInterval(intervalId); // Limpieza al desmontar
  }, []);

  const formatTime = (date) => {
    return date.toLocaleString();
  };

  return (
    <div className="clock">
      {formatTime(time)}
    </div>
  );
}

export default Clock;
