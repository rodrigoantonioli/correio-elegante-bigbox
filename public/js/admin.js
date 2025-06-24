document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Registra o cliente na página de admin
    socket.emit('register', '/admin');

    const messagesListContainer = document.getElementById('predefined-messages-list');
    const addMessageBtn = document.getElementById('btn-add-message');
    const saveChangesBtn = document.getElementById('btn-save-messages');
    const categoriesListContainer = document.getElementById('categories-list');
    const addCategoryBtn = document.getElementById('btn-add-category');

    let categories = [];
    let messages = [];

    // Função para auto-ajustar a altura do textarea
    const autoGrow = (element) => {
        element.style.height = '5px';
        element.style.height = (element.scrollHeight) + 'px';
    };

    // Função para renderizar um item da lista
    const createMessageItem = (msg = { text: '', category: '' }) => {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item-admin';

        const textarea = document.createElement('textarea');
        textarea.value = msg.text || msg;
        textarea.placeholder = "Digite a nova mensagem aqui...";
        textarea.addEventListener('input', () => autoGrow(textarea));

        const select = document.createElement('select');
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
        select.value = msg.category || categories[0] || '';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.type = 'button';
        deleteBtn.addEventListener('click', () => {
            messageItem.remove();
        });

        messageItem.appendChild(textarea);
        messageItem.appendChild(select);
        messageItem.appendChild(deleteBtn);
        
        setTimeout(() => autoGrow(textarea), 0);
        
        return messageItem;
    };

    // Função para renderizar a lista de mensagens prontas
    const renderMessages = () => {
        messagesListContainer.innerHTML = '';
        if (!messagesListContainer) return;
        messages.forEach(msg => {
            const item = createMessageItem(msg);
            messagesListContainer.appendChild(item);
        });
    };
    
    const renderCategories = () => {
        categoriesListContainer.innerHTML = '';
        categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'category-item';
            const input = document.createElement('input');
            input.type = 'text';
            input.value = cat;
            const del = document.createElement('button');
            del.className = 'btn-delete';
            del.innerHTML = '🗑️';
            del.type = 'button';
            del.addEventListener('click', () => div.remove());
            div.appendChild(input);
            div.appendChild(del);
            categoriesListContainer.appendChild(div);
        });
    };

    socket.on('updateConfig', (config) => {
        categories = config.categories || [];
        messages = config.messages || [];
        renderCategories();
        renderMessages();
    });

    socket.emit('getConfig');


    // Adiciona um novo campo de mensagem
    addMessageBtn.addEventListener('click', () => {
        const newItem = createMessageItem();
        messagesListContainer.appendChild(newItem);
        newItem.querySelector('textarea').focus();
    });

    addCategoryBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'category-item';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nova categoria';
        const del = document.createElement('button');
        del.className = 'btn-delete';
        del.innerHTML = '🗑️';
        del.type = 'button';
        del.addEventListener('click', () => div.remove());
        div.appendChild(input);
        div.appendChild(del);
        categoriesListContainer.appendChild(div);
        input.focus();
    });

    // Salva as alterações
    saveChangesBtn.addEventListener('click', () => {
        const items = messagesListContainer.querySelectorAll('.message-item-admin');
        messages = Array.from(items).map(item => ({
            text: item.querySelector('textarea').value.trim(),
            category: item.querySelector('select').value
        })).filter(m => m.text);

        const catInputs = categoriesListContainer.querySelectorAll('input');
        categories = Array.from(catInputs).map(i => i.value.trim()).filter(Boolean);

        socket.emit('updateConfig', { categories, messages });
        alert('Configurações salvas com sucesso!');
    });
}); 