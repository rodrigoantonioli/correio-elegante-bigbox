document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Registra o cliente na página de display
    socket.emit('register', '/display');

    const startOverlay = document.getElementById('start-overlay');
    const startButton = document.getElementById('startButton');
    const displayContainer = document.querySelector('.display-container');

    const messageDisplayDiv = document.getElementById('message-display');
    const qrCodeDiv = document.getElementById('qr-code-display');

    const recipientSpan = document.getElementById('display-recipient');
    const messageSpan = document.getElementById('display-message');
    const senderSpan = document.getElementById('display-sender');

    const qrCanvas = document.getElementById('qr-code');
    const smallQrContainer = document.getElementById('small-qr-container');
    const smallQrCanvas = document.getElementById('qr-code-small');
    const queueCounterDiv = document.getElementById('queue-counter');
    const queueCountSpan = document.getElementById('queue-count');
    const notificationSound = document.getElementById('notification-sound');

    let currentTimeoutId = null;
    let messageStartTime = null;
    const MIN_DISPLAY_TIME = 20000; // Alterado para 20 segundos

    // --- Nova Lógica de Voz ---
    let ptBrVoices = [];

    const loadAndFilterVoices = () => {
        ptBrVoices = window.speechSynthesis.getVoices().filter(voice => voice.lang === 'pt-BR');
        if (ptBrVoices.length > 0) {
            console.log('Vozes em Português (BR) carregadas:', ptBrVoices.map(v => v.name));
        } else {
            console.warn('Nenhuma voz em Português (BR) foi encontrada no sistema.');
        }
    };

    // A lista de vozes é carregada de forma assíncrona.
    window.speechSynthesis.onvoiceschanged = loadAndFilterVoices;
    loadAndFilterVoices(); // Tenta carregar imediatamente caso já estejam disponíveis.
    // --- Fim da Nova Lógica de Voz ---

    const initializeDisplay = () => {
        console.log('Iniciando o telão e ativando o áudio...');

        startOverlay.classList.add('hidden');
        displayContainer.classList.remove('hidden');

        // Tenta "acordar" a API de áudio. É uma prática comum para contornar o bloqueio de autoplay.
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                console.log('Vozes carregadas após interação.');
            };
            // Tenta falar algo vazio para forçar o carregamento
            const utterance = new SpeechSynthesisUtterance('');
            window.speechSynthesis.speak(utterance);
        }

        // Garante que o som pode ser tocado fazendo um play "silencioso"
        notificationSound.play().then(() => {
            notificationSound.pause();
            notificationSound.currentTime = 0;
        }).catch(error => {
            console.log("A reprodução automática de áudio pode estar bloqueada.");
        });
        generateQRCode();
    };

    startButton.addEventListener('click', initializeDisplay, { once: true });

    const generateQRCode = () => {
        const url = window.location.origin;
        const options = { width: 300, margin: 2 };
        
        // Desenha no canvas principal
        QRCode.toCanvas(qrCanvas, url, options, (error) => {
            if (error) console.error('Erro ao gerar QR Code principal:', error);
            else console.log('QR Code principal gerado.');
        });
        
        // Desenha no canvas pequeno
        options.width = 120;
        QRCode.toCanvas(smallQrCanvas, url, options, (error) => {
            if (error) console.error('Erro ao gerar QR Code pequeno:', error);
            else console.log('QR Code pequeno gerado.');
        });
    };

    const speakMessage = (text) => {
        // Se a síntese estiver pausada por algum motivo, resume.
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        
        // Seleciona uma voz aleatória da nossa lista de vozes pt-BR
        if (ptBrVoices.length > 0) {
            const randomVoice = ptBrVoices[Math.floor(Math.random() * ptBrVoices.length)];
            utterance.voice = randomVoice;
            console.log(`Voz selecionada: ${randomVoice.name}`);
        } else {
            console.warn('Nenhuma voz pt-BR disponível, usando a padrão do navegador.');
        }

        // Adiciona variações divertidas de tom e velocidade
        utterance.pitch = 0.8 + Math.random() * 0.4; // Varia entre 0.8 e 1.2
        utterance.rate = 0.9 + Math.random() * 0.3;  // Varia entre 0.9 e 1.2
        
        window.speechSynthesis.speak(utterance);
    };

    const adjustFontSize = (messageText) => {
        // Verifica a largura da tela para definir os tamanhos base e mínimo
        const isMobile = window.innerWidth <= 768;

        const baseSize = isMobile ? 1.2 : 4.5;      // Tamanho base em rem (mobile vs desktop)
        const minSize = isMobile ? 0.9 : 1.8;       // Tamanho mínimo em rem
        const maxLength = isMobile ? 50 : 60;       // Caracteres para começar a reduzir
        const reductionFactor = isMobile ? 0.02 : 0.04; // Fator de redução
        
        let newSize = baseSize;

        if (messageText.length > maxLength) {
            newSize = baseSize - ((messageText.length - maxLength) * reductionFactor);
        }
        
        // Aplica o tamanho de fonte calculado, respeitando o mínimo
        messageSpan.style.fontSize = `${Math.max(minSize, newSize)}rem`;
    };
    
    const finishDisplay = () => {
        messageDisplayDiv.classList.add('hidden');
        smallQrContainer.classList.add('hidden');
        qrCodeDiv.classList.remove('hidden');
        socket.emit('messageDisplayed');
        console.log('Exibição da mensagem concluída.');
        
        // Limpa o estado
        clearTimeout(currentTimeoutId);
        currentTimeoutId = null;
        messageStartTime = null;
    };

    socket.on('displayMessage', (msg) => {
        console.log('Recebendo mensagem para exibir:', msg);

        recipientSpan.textContent = msg.recipient;
        messageSpan.textContent = msg.message;
        senderSpan.textContent = msg.sender;
        
        adjustFontSize(msg.message);
        
        qrCodeDiv.classList.add('hidden');
        messageDisplayDiv.classList.remove('hidden');
        smallQrContainer.classList.remove('hidden');

        const fullText = `Correio Elegante para ${msg.recipient}. A mensagem é: ${msg.message}. Enviado por: ${msg.sender}.`;
        speakMessage(fullText);

        const displayDuration = msg.duration || 10000;
        messageStartTime = Date.now();
        currentTimeoutId = setTimeout(finishDisplay, displayDuration);
    });

    socket.on('interruptDisplay', () => {
        if (!currentTimeoutId) return; // Nenhuma mensagem na tela, não faz nada

        const elapsedTime = Date.now() - messageStartTime;

        if (elapsedTime >= MIN_DISPLAY_TIME) {
            // Se já passou do tempo mínimo, encerra em 1 segundo
            clearTimeout(currentTimeoutId);
            currentTimeoutId = setTimeout(finishDisplay, 1000);
            console.log('Interrompendo: Já passou do tempo mínimo.');
        } else {
            // Se ainda não deu o tempo mínimo, reprograma para encerrar exatamente no tempo mínimo
            const remainingTime = MIN_DISPLAY_TIME - elapsedTime;
            clearTimeout(currentTimeoutId);
            currentTimeoutId = setTimeout(finishDisplay, remainingTime);
            console.log(`Interrompendo: Reprogramado para terminar em ${remainingTime}ms.`);
        }
    });

    socket.on('queueUpdate', (data) => {
        const count = data.count;
        queueCountSpan.textContent = count;

        if (count > 0) {
            queueCounterDiv.classList.remove('hidden');
        } else {
            queueCounterDiv.classList.add('hidden');
        }

        if (data.new && count > 0) {
            notificationSound.currentTime = 0;
            notificationSound.play();
            // Animação visual no contador
            queueCounterDiv.classList.add('new-message');
            setTimeout(() => {
                queueCounterDiv.classList.remove('new-message');
            }, 300);
        }
    });
}); 