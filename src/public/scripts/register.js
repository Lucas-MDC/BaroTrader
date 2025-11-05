// const btn_logout = document.querySelector('button#logout-button');
const btn_register = document.querySelector('button#register-button');

btn_register.addEventListener('click', (event) => {
    // Previne qualquer comportamento padrão do botão
    event.preventDefault();
    
    // Redireciona para a página logged.html
    window.location.href = '/home';
});