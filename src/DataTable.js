const DataTable = ({ data }) => {
    return (
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Longitud</th>
            <th>Latitud</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            console.log('Data item:', item); // Log para verificar el item
            const timestamp = item[2];
            console.log('Timestamp:', timestamp); // Verificar el timestamp
            const date = new Date(timestamp * 1000); // Asegúrate de que el timestamp está en segundos y conviértelo a milisegundos
            console.log('Converted Date:', date); // Verificar la fecha convertida
            const dateString = date.toLocaleDateString();
            const timeString = date.toLocaleTimeString();
            return (
              <tr key={index}>
                <td>{dateString}</td>
                <td>{timeString}</td>
                <td>{item[1]}</td>
                <td>{item[0]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };
  
  export default DataTable;
  