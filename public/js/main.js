document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Registra o cliente na página principal
    socket.emit('register', '/');

    const form = document.getElementById('messageForm');
    const recipientInput = document.getElementById('recipient');
    const categorySelect = document.getElementById('category');
    const messageSelect = document.getElementById('message');
    const senderInput = document.getElementById('sender');
    const confirmationDiv = document.getElementById('confirmation');

    let allCategories = [];
    let allMessages = [];

    const populateCategories = () => {
        if (!categorySelect) return;
        categorySelect.innerHTML = '<option value="">Todas as Categorias</option>';
        allCategories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
        });
    };

    const populateMessages = () => {
        const selected = categorySelect.value;
        const filtered = selected ? allMessages.filter(m => m.category === selected) : allMessages;
        const selectedValue = messageSelect.value;
        messageSelect.innerHTML = '<option value="" disabled>Escolha uma mensagem...</option>';
        filtered.forEach(m => {
            const option = document.createElement('option');
            option.value = m.text;
            option.textContent = m.text;
            messageSelect.appendChild(option);
        });
        if (Array.from(messageSelect.options).some(opt => opt.value === selectedValue)) {
            messageSelect.value = selectedValue;
        } else {
            messageSelect.value = "";
        }
    };

    socket.on('updateConfig', (config) => {
        allCategories = config.categories || [];
        allMessages = config.messages || [];
        populateCategories();
        populateMessages();
    });

    if (categorySelect) {
        categorySelect.addEventListener('change', populateMessages);
    }

    // Solicita as configurações iniciais
    socket.emit('getConfig');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const message = {
            recipient: recipientInput.value.trim(),
            message: messageSelect.value,
            sender: senderInput.value.trim()
        };

        if (!message.recipient || !message.message || !message.sender) {
            alert('Por favor, preencha todos os campos!');
            return;
        }

        socket.emit('newMessage', message);

        // Mostra confirmação e limpa o formulário
        confirmationDiv.classList.remove('hidden');
        form.reset();
        messageSelect.value = ""; // Garante que o select seja resetado

        setTimeout(() => {
            confirmationDiv.classList.add('hidden');
        }, 3000);
    });
}); 