document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const clientsTableBody = document.querySelector('#clients-table tbody');
    const blockedIpsTableBody = document.querySelector('#blocked-ips-table tbody');

    // Registrar esta página no servidor
    socket.emit('register', 'clients_admin');

    // Ouvir atualizações da lista de clientes
    socket.on('clientsUpdate', (payload) => {
        renderClients(payload.clients);
        renderBlockedIps(payload.blocked);
    });
    
    // Alerta para o admin de que seu IP foi bloqueado por outro admin
    socket.on('blocked', (message) => {
        alert(message);
        window.location.href = '/login.html';
    });

    function renderClients(clients) {
        clientsTableBody.innerHTML = ''; // Limpa a tabela

        if (clients.length === 0) {
            clientsTableBody.innerHTML = '<tr><td colspan="3">Nenhum cliente conectado no momento.</td></tr>';
            return;
        }

        clients.forEach(client => {
            const row = document.createElement('tr');
            
            // Mapeia os nomes das páginas e junta com uma quebra de linha
            const pageNames = client.pages.map(page => getPageName(page)).join('<br>');

            row.innerHTML = `
                <td>${client.ip}</td>
                <td>${pageNames}</td>
                <td>
                    <button class="block-btn" data-ip="${client.ip}">Bloquear IP</button>
                </td>
            `;
            clientsTableBody.appendChild(row);
        });
    }

    function renderBlockedIps(blockedIps) {
        blockedIpsTableBody.innerHTML = ''; // Limpa a tabela

        if (blockedIps.length === 0) {
            blockedIpsTableBody.innerHTML = '<tr><td colspan="2">Nenhum IP bloqueado.</td></tr>';
            return;
        }

        blockedIps.forEach(ip => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ip}</td>
                <td>
                    <button class="unblock-btn" data-ip="${ip}">Desbloquear</button>
                </td>
            `;
            blockedIpsTableBody.appendChild(row);
        });
    }
    
    function getPageName(page) {
        switch (page) {
            case '/':
                return 'Envio de Mensagem';
            case '/display':
                return 'Telão';
            case '/admin':
                return 'Admin (Mensagens)';
            case 'clients_admin':
                return 'Admin (Monitor)';
            case '/history':
                return 'Admin (Histórico)';
            default:
                return page;
        }
    }

    // Adicionar listener para o botão de bloquear
    clientsTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('block-btn')) {
            const ipToBlock = event.target.dataset.ip;
            if (confirm(`Tem certeza que deseja bloquear o IP ${ipToBlock}? Esta ação desconectará todos os usuários com este IP.`)) {
                socket.emit('blockIp', ipToBlock);
            }
        }
    });

    // Adicionar listener para o botão de desbloquear
    blockedIpsTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('unblock-btn')) {
            const ipToUnblock = event.target.dataset.ip;
            if (confirm(`Tem certeza que deseja desbloquear o IP ${ipToUnblock}?`)) {
                socket.emit('unblockIp', ipToUnblock);
            }
        }
    });
}); 