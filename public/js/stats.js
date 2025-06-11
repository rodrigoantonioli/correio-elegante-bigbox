document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Elementos da página
    const peakClientsEl = document.getElementById('peak-clients');
    const currentClientsEl = document.getElementById('current-clients');
    const popularMessageEl = document.getElementById('popular-message');
    const pageAccessListEl = document.getElementById('page-access-list');
    
    // Registrar esta página no servidor
    socket.emit('register', 'stats_admin');

    // Mapeamento de nomes de página para exibição
    const pageNameMapping = {
        '/': 'Envio de Mensagem',
        '/display': 'Telão',
        '/admin': 'Admin (Mensagens)',
        'clients_admin': 'Admin (Monitor)',
        '/history': 'Admin (Histórico)',
        'stats_admin': 'Admin (Estatísticas)'
    };

    // Configuração do Gráfico
    const ctx = document.getElementById('clients-chart').getContext('2d');
    const clientsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Clientes Conectados',
                data: [],
                borderColor: '#581c87',
                backgroundColor: 'rgba(88, 28, 135, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Ouvir atualizações de estatísticas
    socket.on('statsUpdate', (stats) => {
        // Atualiza os cards
        peakClientsEl.textContent = stats.peakConcurrentClients;
        currentClientsEl.textContent = stats.clientsOverTime.length > 0 ? stats.clientsOverTime[stats.clientsOverTime.length - 1].count : 0;

        // Atualiza a mensagem mais popular
        const popularMsg = getMostPopularMessage(stats.predefinedMessageCounts);
        popularMessageEl.textContent = popularMsg || 'Nenhuma mensagem enviada ainda.';
        
        // Atualiza a lista de acessos por página
        updatePageAccessList(stats.pageAccessCounts);

        // Atualiza o gráfico
        const labels = stats.clientsOverTime.map(data => new Date(data.time).toLocaleTimeString('pt-BR'));
        const data = stats.clientsOverTime.map(data => data.count);
        clientsChart.data.labels = labels;
        clientsChart.data.datasets[0].data = data;
        clientsChart.update();
    });

    function getMostPopularMessage(counts) {
        if (Object.keys(counts).length === 0) return null;
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    function updatePageAccessList(counts) {
        pageAccessListEl.innerHTML = '';
        const sortedPages = Object.entries(counts).sort(([,a],[,b]) => b - a);

        for (const [page, count] of sortedPages) {
            const li = document.createElement('li');
            const pageName = pageNameMapping[page] || page;
            li.innerHTML = `<span class="page-name">${pageName}</span> <span class="page-count">${count} acessos</span>`;
            pageAccessListEl.appendChild(li);
        }
    }
}); 