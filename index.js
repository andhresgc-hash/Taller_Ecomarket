const subscriptionForm = document.querySelector('.suscripcion-form');
const subscriptionMessage = document.querySelector('#suscripcion-message');

subscriptionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    subscriptionMessage.textContent = '¡Registro exitoso! Gracias por unirte a EcoMarket. En esta demostración, tus datos no se envían a un servidor.';
    subscriptionMessage.hidden = false;
    subscriptionForm.reset();
});
