document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Elementos da página
    const totalMessagesEl = document.getElementById('total-messages');
    const peakClientsEl = document.getElementById('peak-clients');
    const currentClientsEl = document.getElementById('current-clients');
    const pageAccessList = document.getElementById('page-access-list');
    const popularMessagesContainer = document.getElementById('popular-messages-container');
    const topRecipientsContainer = document.getElementById('top-recipients-container');
    
    // Conectar à sala de stats no servidor
    socket.on('connect', () => {
        socket.emit('register', '/stats');
        socket.emit('join_stats_admin');
    });

    // Ouvir atualizações de estatísticas
    socket.on('statsUpdate', (stats) => {
        totalMessagesEl.textContent = stats.totalMessages || 0;
        peakClientsEl.textContent = stats.peakConcurrentClients || 0;
        currentClientsEl.textContent = stats.currentClients || 0;

        updatePageAccessList(stats.pageAccessCounts || {});
        updateRankingList(popularMessagesContainer, stats.popularMessages, 'Nenhuma mensagem foi enviada ainda.');
        updateRankingList(topRecipientsContainer, stats.topRecipients, 'Ninguém recebeu mensagens ainda.');
    });

    function updatePageAccessList(pageAccessCounts) {
        pageAccessList.innerHTML = '';
        
        if (!pageAccessCounts || Object.keys(pageAccessCounts).length === 0) {
            pageAccessList.innerHTML = '<li>Nenhum acesso registrado ainda.</li>';
            return;
        }

        // Mapear nomes de páginas para nomes amigáveis
        const pageNames = {
            '/': 'Envio de Mensagens',
            '/display': 'Telão',
            '/admin': 'Administração',
            '/history': 'Histórico',
            '/clients': 'Monitor de Clientes',
            '/stats': 'Estatísticas',
            '/login': 'Login'
        };

        // Ordenar por número de acessos (maior para menor)
        const sortedPages = Object.entries(pageAccessCounts)
            .sort(([, a], [, b]) => b - a);

        sortedPages.forEach(([page, count]) => {
            const li = document.createElement('li');
            const pageName = pageNames[page] || page;
            const countText = count === 1 ? 'acesso' : 'acessos';
            li.innerHTML = `
                <span class="page-name">${pageName}</span>
                <span>${count} ${countText}</span>
            `;
            pageAccessList.appendChild(li);
        });
    }

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
            const countText = item.count === 1 ? 'vez' : 'vezes';
            li.innerHTML = `<span>"${name}"</span> <strong>(${item.count} ${countText})</strong>`;
            ol.appendChild(li);
        });
        container.appendChild(ol);
    }
}); 