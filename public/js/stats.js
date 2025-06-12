document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Elementos da página
    const totalMessagesEl = document.getElementById('total-messages');
    const peakClientsEl = document.getElementById('peak-clients');
    const popularMessagesContainer = document.getElementById('popular-messages-container');
    const topRecipientsContainer = document.getElementById('top-recipients-container');
    
    // Conectar à sala de stats no servidor
    socket.on('connect', () => {
        socket.emit('join_stats_admin');
    });

    // Ouvir atualizações de estatísticas
    socket.on('statsUpdate', (stats) => {
        totalMessagesEl.textContent = stats.totalMessages || 0;
        peakClientsEl.textContent = stats.peakConcurrentClients || 0;

        updateRankingList(popularMessagesContainer, stats.popularMessages, 'Nenhuma mensagem foi enviada ainda.');
        updateRankingList(topRecipientsContainer, stats.topRecipients, 'Ninguém recebeu mensagens ainda.');
    });

    function updateRankingList(container, items, emptyMessage) {
        container.innerHTML = '';
        if (!items || items.length === 0) {
            container.innerHTML = `<p>${emptyMessage}</p>`;
            return;
        }

        const ol = document.createElement('ol');
        items.forEach(item => {
            const li = document.createElement('li');
            const name = item.message || item.name; // Para funcionar com ambas as listas
            li.innerHTML = `<span>"${name}"</span> <strong>(${item.count} vezes)</strong>`;
            ol.appendChild(li);
        });
        container.appendChild(ol);
    }
}); 