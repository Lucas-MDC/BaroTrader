const btn_login = document.querySelector('button#login-button');

// Adiciona o evento de clique especificamente no botão
btn_login.addEventListener('click', (event) => {
    // Previne qualquer comportamento padrão do botão
    event.preventDefault();
    
    // Redireciona para a página logged.html
    window.location.href = '/conta';
});