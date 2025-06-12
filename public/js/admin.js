document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Registra o cliente na página de admin
    socket.emit('register', '/admin');

    const messagesListContainer = document.getElementById('predefined-messages-list');
    const addMessageBtn = document.getElementById('btn-add-message');
    const saveChangesBtn = document.getElementById('btn-save-messages');
    const displayModeRadios = document.querySelectorAll('input[name="displayMode"]');

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
        if (!messagesListContainer) return; // Checagem de segurança
        messages.forEach(msg => {
            const messageItem = createMessageItem(msg);
            messagesListContainer.appendChild(messageItem);
        });
    };
    
    // Carrega as mensagens iniciais
    socket.on('updateMessages', renderMessages);
    socket.emit('getMessages');

    // --- Lógica do Modo de Exibição ---
    socket.on('initialState', (state) => {
        const currentMode = state.displayMode;
        const radioToCheck = document.querySelector(`input[name="displayMode"][value="${currentMode}"]`);
        if (radioToCheck) {
            radioToCheck.checked = true;
        }
    });

    socket.on('modeUpdate', (newMode) => {
        const radioToCheck = document.querySelector(`input[name="displayMode"][value="${newMode}"]`);
        if (radioToCheck) {
            radioToCheck.checked = true;
        }
    });

    displayModeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            socket.emit('setDisplayMode', event.target.value);
        });
    });
    // --- Fim da Lógica ---

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