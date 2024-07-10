export function handleBackButton() {
    // Manejador del evento popstate
    window.onpopstate = function(event) {
      console.log("El usuario hizo clic en el botón Atrás");
    };
  
    // Función para prevenir el comportamiento predeterminado y agregar lógica personalizada
    const popStateHandler = function(event) {
      event.preventDefault(); // Evita recargar la página anterior
  
      // Lógica personalizada: Redirigir a la página principal
      window.location.href = "/";
    };
  
    // Agregar el event listener
    window.addEventListener('popstate', popStateHandler);
  
    // Función de limpieza para remover el event listener al desmontar
    return () => {
      window.removeEventListener('popstate', popStateHandler);
    };
  }
  