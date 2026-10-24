// Inicializar el carrusel con autoplay
document.addEventListener('DOMContentLoaded', function() {
  // El carrusel ya se inicializa automáticamente con Bootstrap
  // Pero podemos añadirle opciones avanzadas si queremos

  // Efecto de fade en las tarjetas al hacer scroll (opcional)
  const cards = document.querySelectorAll('.product-card, .service-card, .testimonial-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => {
    card.style.opacity = 0;
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s, transform 0.5s';
    observer.observe(card);
  });

  // Botones "Cotizar" - funcionalidad simple de alerta
  document.querySelectorAll('.product-card .btn-outline-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const productName = this.closest('.product-card').querySelector('.card-title').textContent;
      alert(`📋 Cotización para: ${productName}\n\nUn asesor se comunicará con usted.`);
    });
  });

  // Enlace de WhatsApp en el CTA
  const waBtn = document.querySelector('#contacto .btn-light');
  if (waBtn) {
    waBtn.addEventListener('click', function(e) {
      // El enlace ya tiene href, solo añadimos un track (opcional)
      console.log('Redirigiendo a WhatsApp...');
    });
  }
});