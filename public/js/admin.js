document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const messagesListContainer = document.getElementById('messages-list-container');
    const addMessageBtn = document.getElementById('addMessageBtn');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const messageLogBody = document.querySelector('#messageLog tbody');

    // Função para auto-ajustar a altura do textarea
    const autoGrow = (element) => {
        element.style.height = '5px';
        element.style.height = (element.scrollHeight) + 'px';
    };

    // Função para renderizar um item da lista
    const createMessageItem = (msg = '') => {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item-admin';

        const textarea = document.createElement('textarea');
        textarea.value = msg;
        textarea.placeholder = "Digite a nova mensagem aqui...";
        textarea.addEventListener('input', () => autoGrow(textarea));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.type = 'button';
        deleteBtn.addEventListener('click', () => {
            messageItem.remove();
        });

        messageItem.appendChild(textarea);
        messageItem.appendChild(deleteBtn);
        
        setTimeout(() => autoGrow(textarea), 0);
        
        return messageItem;
    };

    // Função para renderizar a lista de mensagens prontas
    const renderMessages = (messages) => {
        messagesListContainer.innerHTML = '';
        messages.forEach(msg => {
            const messageItem = createMessageItem(msg);
            messagesListContainer.appendChild(messageItem);
        });
    };
    
    // Função para renderizar o log de mensagens
    const renderLog = (log) => {
        messageLogBody.innerHTML = '';
        log.slice().reverse().forEach(msg => {
            const row = document.createElement('tr');
            const formattedDate = msg.timestamp 
                ? new Date(msg.timestamp).toLocaleString('pt-BR') 
                : '---';
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${msg.recipient}</td>
                <td>${msg.message}</td>
                <td>${msg.sender}</td>
            `;
            messageLogBody.appendChild(row);
        });
    };
    
    // Carrega as mensagens e o log iniciais
    socket.on('updateMessages', renderMessages);
    socket.on('messageLog', renderLog);
    socket.emit('getMessages');

    // Adiciona um novo campo de mensagem
    addMessageBtn.addEventListener('click', () => {
        const newItem = createMessageItem();
        messagesListContainer.appendChild(newItem);
        newItem.querySelector('textarea').focus();
    });

    // Salva as alterações
    saveChangesBtn.addEventListener('click', () => {
        const textareas = messagesListContainer.querySelectorAll('textarea');
        const newMessages = Array.from(textareas).map(textarea => textarea.value.trim()).filter(Boolean);
        
        socket.emit('updateMessages', newMessages);
        alert('Mensagens salvas com sucesso!');
    });
}); 