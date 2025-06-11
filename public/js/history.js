document.addEventListener('DOMContentLoaded', () => {
    // Registra o cliente na página de histórico
    const socket = io();
    socket.emit('register', '/history');

    const logContent = document.getElementById('log-content');

    fetch('/api/history')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            logContent.textContent = data;
        })
        .catch(error => {
            console.error('Erro ao buscar o histórico:', error);
            logContent.textContent = 'Erro ao carregar o histórico.';
        });
}); 