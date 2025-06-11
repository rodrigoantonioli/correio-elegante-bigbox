document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    socket.emit('register', '/display');

    // --- Elementos Globais ---
    const startOverlay = document.getElementById('start-overlay');
    const startButton = document.getElementById('startButton');
    const mainDisplayArea = document.getElementById('main-display-area');
    const notificationSound = document.getElementById('notification-sound');
    
    // --- Elementos de Tela ---
    const waitingScreen = document.getElementById('waiting-screen');
    const messageScreen = document.getElementById('message-screen');
    const displayWrapper = document.querySelector('.display-wrapper');
    const queueCounterDiv = document.getElementById('queue-counter');
    const queueCountSpan = document.getElementById('queue-count');

    // --- Elementos de Conteúdo ---
    const incentivePhraseEl = document.getElementById('incentive-phrase');
    const totalCountEl = document.getElementById('total-count');

    // --- Elementos dos Modos (Default, Carousel, Ticker) ---
    const modeContainers = document.querySelectorAll('.mode-container');
    const defaultRecipientSpan = document.getElementById('display-recipient');
    const defaultMessageSpan = document.getElementById('display-message');
    const defaultSenderSpan = document.getElementById('display-sender');
    const carouselSlide = document.getElementById('carousel-slide');
    const carouselPrevBtn = document.getElementById('carousel-prev');
    const carouselNextBtn = document.getElementById('carousel-next');
    const tickerContent = document.getElementById('ticker-content');

    // --- Estado do Display ---
    let currentMode = 'default';
    let displayedHistory = [];
    let carouselIndex = -1;
    let carouselTimeout;
    let currentMessageTimeout;
    let messageStartTime = null;
    const MIN_DISPLAY_TIME = 20000; // 20 segundos
    const MAX_DISPLAY_TIME = 60000; // 1 minuto
    let ptBrVoices = [];
    let totalMessages = 0;

    const incentivePhrases = [
        "Sua mensagem pode ser a próxima!",
        "Quem será o próximo homenageado?",
        "Envie uma mensagem para aquele colega especial!",
        "Não seja tímido, o correio é anônimo!",
        "Aproveite a festa e espalhe o carinho!"
    ];
    let phraseInterval;

    // --- Inicialização ---
    const initializeDisplay = () => {
        startOverlay.classList.add('hidden');
        mainDisplayArea.classList.remove('hidden');
        setScreenState('waiting'); // Começa na tela de espera

        // Acorda a API de áudio
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {};
            const utterance = new SpeechSynthesisUtterance('');
            window.speechSynthesis.speak(utterance);
        }
        notificationSound.play().then(() => {
            notificationSound.pause();
            notificationSound.currentTime = 0;
        }).catch(e => console.log("Áudio bloqueado."));
        generateQRCode();
    };

    startButton.addEventListener('click', initializeDisplay, { once: true });

    // --- Gerenciamento de Estado da Tela ---
    const setScreenState = (state) => {
        if (state === 'waiting') {
            waitingScreen.classList.remove('hidden');
            messageScreen.classList.add('hidden');
            startIncentiveCycle();
        } else { // 'message'
            waitingScreen.classList.add('hidden');
            messageScreen.classList.remove('hidden');
            stopIncentiveCycle();
        }
    };

    // --- Ciclo de Frases de Incentivo ---
    const startIncentiveCycle = () => {
        stopIncentiveCycle(); // Garante que não haja múltiplos intervalos
        let i = 0;
        phraseInterval = setInterval(() => {
            i = (i + 1) % incentivePhrases.length;
            incentivePhraseEl.textContent = incentivePhrases[i];
        }, 8000);
    };
    const stopIncentiveCycle = () => clearInterval(phraseInterval);
    
    // --- Lógica de Voz (sem alterações) ---
    const loadAndFilterVoices = () => ptBrVoices = window.speechSynthesis.getVoices().filter(voice => voice.lang === 'pt-BR');
    window.speechSynthesis.onvoiceschanged = loadAndFilterVoices;
    loadAndFilterVoices();
    const speakMessage = (text, forceVoice) => {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        if (ptBrVoices.length > 0) {
            utterance.voice = forceVoice || ptBrVoices[Math.floor(Math.random() * ptBrVoices.length)];
        }
        utterance.pitch = 0.8 + Math.random() * 0.4;
        utterance.rate = 0.9 + Math.random() * 0.3;
        window.speechSynthesis.speak(utterance);
    };

    // --- Funções de Renderização dos Modos ---
    const renderDefault = (msg) => {
        defaultRecipientSpan.textContent = msg.recipient;
        defaultMessageSpan.textContent = msg.message;
        defaultSenderSpan.textContent = msg.sender;
        adjustFontSize(defaultMessageSpan, msg.message);
    };

    const renderCarousel = (index) => {
        if (index < 0 || index >= displayedHistory.length) return;
        carouselIndex = index;
        const msg = displayedHistory[index];
        carouselSlide.innerHTML = `
            <div class="message-card">
                <p class="recipient">Para: <span>${msg.recipient}</span></p>
                <p class="message-text">"<span>${msg.message}</span>"</p>
                <p class="sender">De: <span>${msg.sender}</span></p>
                <button class="carousel-speak-btn" aria-label="Ler mensagem"><i class="fas fa-volume-up"></i></button>
            </div>
        `;
        adjustFontSize(carouselSlide.querySelector('.message-text > span'), msg.message);
        carouselPrevBtn.style.visibility = (index > 0) ? 'visible' : 'hidden';
        carouselNextBtn.style.visibility = (index < displayedHistory.length - 1) ? 'visible' : 'hidden';
    };

    const renderTicker = (msg) => {
        tickerContent.innerHTML = `Para: <strong>${msg.recipient}</strong> — "${msg.message}" — De: <strong>${msg.sender}</strong>`;
        const speedFactor = 0.08; // segundos por caracter
        const duration = tickerContent.textContent.length * speedFactor;
        tickerContent.style.animationDuration = `${Math.max(10, duration)}s`;
        tickerContent.classList.add('animate');
    };

    // --- Controle de Exibição ---
    const switchMode = (newMode) => {
        currentMode = newMode;
        modeContainers.forEach(c => c.classList.add('hidden'));
        const activeContainer = document.getElementById(`${newMode}-mode-container`);
        if (activeContainer) activeContainer.classList.remove('hidden');
        console.log(`Modo alterado para: ${newMode}`);
    };

    const startDisplay = (msg) => {
        setScreenState('message');
        displayWrapper.classList.remove('hidden');

        switch (currentMode) {
            case 'default':
                renderDefault(msg);
                break;
            case 'carousel':
                renderCarousel(displayedHistory.length - 1);
                clearTimeout(carouselTimeout); // Para o timer de auto-avanço se uma nova msg chegar
                break;
            case 'ticker':
                renderTicker(msg);
                break;
        }
        const fullText = `Correio Elegante para ${msg.recipient}. A mensagem é: ${msg.message}. Enviado por: ${msg.sender}.`;
        speakMessage(fullText);
        messageStartTime = Date.now();
        currentMessageTimeout = setTimeout(finishDisplay, MAX_DISPLAY_TIME);
    };

    const finishDisplay = () => {
        displayWrapper.classList.add('hidden');
        if (currentMode === 'ticker') tickerContent.classList.remove('animate');
        
        clearTimeout(currentMessageTimeout);
        clearTimeout(carouselTimeout);
        messageStartTime = null;

        setScreenState('waiting'); // Volta para a tela de espera
        
        socket.emit('messageDisplayed');
    };

    // --- Listeners de Socket ---
    socket.on('initialState', state => {
        console.log("Estado inicial recebido:", state);
        switchMode(state.displayMode);
        displayedHistory = state.displayedHistory || [];
        totalMessages = state.totalMessages || 0;
        totalCountEl.textContent = totalMessages;

        // Se o telão estava ocupado quando reconectamos, retoma a exibição
        if (state.isBusy && state.currentMessage) {
            console.log("Retomando exibição da mensagem atual...");
            const remainingTime = state.currentMessage.duration - (Date.now() - new Date(state.currentMessage.timestamp).getTime());
            
            if (remainingTime > 1000) { // Se resta mais de 1 segundo
                // Define o histórico para que o carrossel funcione corretamente
                displayedHistory = state.displayedHistory; 
                startDisplay(state.currentMessage);
            } else {
                // Se o tempo já expirou, notifica o servidor e vai para a espera
                setScreenState('waiting');
                socket.emit('messageDisplayed');
            }
        } else {
            // Se não, inicia normalmente na tela de espera
            setScreenState('waiting');
        }
    });
    socket.on('modeUpdate', newMode => switchMode(newMode));
    socket.on('displayMessage', data => {
        totalMessages = data.totalMessages;
        totalCountEl.textContent = totalMessages;
        displayedHistory = data.history;
        startDisplay(data.message);
    });
    socket.on('queueUpdate', (data) => {
        totalMessages = data.totalMessages;
        totalCountEl.textContent = totalMessages;
        queueCountSpan.textContent = data.count;
        queueCounterDiv.classList.toggle('hidden', data.count === 0);

        // Lógica para interromper a mensagem atual se uma nova entrar na fila
        if (data.count > 0 && messageStartTime) {
            const elapsedTime = Date.now() - messageStartTime;
            if (elapsedTime >= MIN_DISPLAY_TIME) {
                console.log('Fila com nova mensagem e tempo mínimo atingido. Exibindo a próxima.');
                finishDisplay();
            }
        }

        if (data.new && data.count > 0) {
            notificationSound.play();
            queueCounterDiv.classList.add('new-message');
            setTimeout(() => queueCounterDiv.classList.remove('new-message'), 300);
        }
    });

    // --- Listeners de Eventos ---
    carouselPrevBtn.addEventListener('click', () => {
        clearTimeout(carouselTimeout);
        if (carouselIndex > 0) renderCarousel(carouselIndex - 1);
    });
    carouselNextBtn.addEventListener('click', () => {
        clearTimeout(carouselTimeout);
        if (carouselIndex < displayedHistory.length - 1) renderCarousel(carouselIndex + 1);
    });
    carouselSlide.addEventListener('click', (event) => {
        const speakBtn = event.target.closest('.carousel-speak-btn');
        if (speakBtn) {
            clearTimeout(carouselTimeout);
            const msg = displayedHistory[carouselIndex];
            const text = `Para ${msg.recipient}, ${msg.message}, de ${msg.sender}.`;
            speakMessage(text);
            
            // Feedback visual no botão
            speakBtn.classList.add('speaking');
            setTimeout(() => speakBtn.classList.remove('speaking'), 1000);
        }
    });

    // --- Funções Auxiliares (QR Code, Font Size) ---
    const generateQRCode = () => {
        const url = window.location.origin;
        // Desenha o QR Code grande (na tela de espera)
        QRCode.toCanvas(document.getElementById('qr-code'), url, { width: 300, margin: 2 }, (e) => { if(e) console.error(e); });
        // Desenha o QR Code pequeno (na barra lateral)
        QRCode.toCanvas(document.getElementById('qr-code-small'), url, { width: 180, margin: 1 }, (e) => { if(e) console.error(e); });
    };
    const adjustFontSize = (element, messageText) => {
        const isMobile = window.innerWidth <= 1024; // Ajuste o breakpoint se necessário
        const baseSize = isMobile ? 1.2 : 4.5;
        const minSize = isMobile ? 0.9 : 1.8;
        const maxLength = isMobile ? 50 : 60;
        const reductionFactor = isMobile ? 0.02 : 0.04;
        let newSize = baseSize;
        if (messageText.length > maxLength) {
            newSize = baseSize - ((messageText.length - maxLength) * reductionFactor);
        }
        element.style.fontSize = `${Math.max(minSize, newSize)}rem`;
    };
}); 