export function handleBackButton() {
    window.onpopstate = function(event) {
      // Aquí puedes agregar la lógica que deseas ejecutar cuando el usuario haga clic en "Atrás"
      // Por ejemplo, puedes redirigir a otra página, actualizar el estado de tu aplicación, etc.
      console.log("El usuario hizo clic en el botón Atrás");
    };
  
    // Prevenir el comportamiento predeterminado del botón "Atrás" para evitar errores
    window.addEventListener('popstate', function(event) {
      // Lógica para prevenir el comportamiento predeterminado (recargar la página anterior)
      // Por ejemplo, puedes usar event.preventDefault() o history.pushState() para controlar la navegación
      event.preventDefault(); // Evita recargar la página anterior
      // Puedes agregar aquí tu propia lógica de navegación
    });
  }
