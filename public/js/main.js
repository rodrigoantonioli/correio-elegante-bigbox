document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Registra o cliente na página principal
    socket.emit('register', '/');

    const form = document.getElementById('messageForm');
    const recipientInput = document.getElementById('recipient');
    const messageSelect = document.getElementById('message');
    const senderInput = document.getElementById('sender');
    const confirmationDiv = document.getElementById('confirmation');

    // Popula o select com as mensagens prontas
    socket.on('updateMessages', (messages) => {
        // Salva o valor selecionado
        const selectedValue = messageSelect.value;
        
        messageSelect.innerHTML = '<option value="" disabled>Escolha uma mensagem...</option>';
        messages.forEach(msg => {
            const option = document.createElement('option');
            option.value = msg;
            option.textContent = msg;
            messageSelect.appendChild(option);
        });

        // Restaura a seleção se a opção ainda existir
        if (Array.from(messageSelect.options).some(opt => opt.value === selectedValue)) {
            messageSelect.value = selectedValue;
        } else {
            messageSelect.value = "";
        }
    });

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