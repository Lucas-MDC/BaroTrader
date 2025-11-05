const btn_logout = document.querySelector('button#logout-button');

btn_logout.addEventListener('click', (event) => {
    // Previne qualquer comportamento padrão do botão
    event.preventDefault();
    
    // Redireciona para a página logged.html
    window.location.href = '/';
});