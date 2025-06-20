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
    let minDisplayTimeout; // Novo temporizador para o tempo mínimo
    let messageStartTime = null;
    const MIN_DISPLAY_TIME = 20000; // 20 segundos
    const MAX_DISPLAY_TIME = 60000; // 1 minuto
    let ptBrVoices = [];
    let totalMessages = 0; // Inicializa com 0 explicitamente

    const incentivePhrases = [
        "Sua mensagem pode ser a próxima!",
        "Quem será o próximo homenageado?",
        "Envie uma mensagem para aquele colega especial!",
        "Não seja tímido, o correio é anônimo!",
        "Aproveite a festa e espalhe o carinho!"
    ];
    let phraseInterval;

    const log = (message) => {
        const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
        console.log(`[${time}] TELÃO: ${message}`);
    };

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
        
        // Atualiza o display de mensagens inicialmente
        updateTotalMessagesDisplay();
        
        // Gera o QR code com um pequeno delay para garantir que a UI esteja pronta
        setTimeout(generateQRCode, 100);
    };

    startButton.addEventListener('click', initializeDisplay, { once: true });

    // --- Gerenciamento de Estado da Tela ---
    const setScreenState = (state) => {
        log(`Transicionando para o estado de '${state}'.`);
        if (state === 'waiting') {
            console.log('Transicionando para o estado de ESPERA.');
            waitingScreen.classList.remove('hidden');
            messageScreen.classList.add('hidden');
            displayWrapper.classList.add('hidden');
            if (currentMode === 'ticker') tickerContent.classList.remove('animate');
            startIncentiveCycle();
        } else { // 'message'
            console.log('Transicionando para o estado de MENSAGEM.');
            waitingScreen.classList.add('hidden');
            messageScreen.classList.remove('hidden');
            displayWrapper.classList.remove('hidden');
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
    
    // --- Lógica de Voz ---
    const loadAndFilterVoices = () => {
        return window.speechSynthesis.getVoices().filter(voice => voice.lang === 'pt-BR');
    }
    
    const speakMessage = (text, forceVoice) => {
        const ptBrVoices = loadAndFilterVoices();
    
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        
        if (ptBrVoices.length > 0) {
            utterance.voice = forceVoice || ptBrVoices[Math.floor(Math.random() * ptBrVoices.length)];
        } else {
            console.warn("Nenhuma voz em Português (pt-BR) encontrada. Usando a voz padrão.");
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

    const startDisplay = (msg, duration) => {
        setScreenState('message');
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
        log(`Iniciando exibição da mensagem ID ${msg.id}. Duração máxima: ${duration || MAX_DISPLAY_TIME}ms.`);
        
        const displayDuration = duration !== undefined ? duration : MAX_DISPLAY_TIME;
        
        // Limpa temporizadores anteriores para segurança
        clearTimeout(currentMessageTimeout);
        clearTimeout(minDisplayTimeout);

        // Define os dois temporizadores
        currentMessageTimeout = setTimeout(finishDisplay, displayDuration);
        minDisplayTimeout = setTimeout(checkQueueForInterruption, MIN_DISPLAY_TIME);
    };

    const finishDisplay = () => {
        log(`Finalizando exibição. Notificando o servidor.`);
        
        // Limpa AMBOS os temporizadores
        clearTimeout(currentMessageTimeout);
        clearTimeout(minDisplayTimeout);
        
        currentMessageTimeout = null;
        minDisplayTimeout = null;
        messageStartTime = null;
        
        socket.emit('messageDisplayed');
    };

    // Nova função para verificar a fila após o tempo mínimo
    const checkQueueForInterruption = () => {
        log('Temporizador de 20s disparou. Verificando a fila.');
        const currentQueueCount = parseInt(queueCountSpan.textContent, 10) || 0;
        
        if (currentQueueCount > 0) {
            log(`✅ Fila tem ${currentQueueCount} item(s). Interrompendo exibição para avançar a fila.`);
            finishDisplay();
        } else {
            log('❌ Fila vazia. Mensagem continuará em exibição.');
        }
    };

    // --- Listeners de Socket ---
    socket.on('initialState', state => {
        console.log("Estado inicial recebido:", state);
        switchMode(state.displayMode);
        displayedHistory = state.displayedHistory || [];
        totalMessages = state.totalMessages || 0; // Garante que seja um número
        updateTotalMessagesDisplay();

        // Se o telão estava ocupado quando reconectamos, retoma a exibição
        if (state.isBusy && state.currentMessage) {
            console.log("Retomando exibição da mensagem atual...");
            const elapsedTime = Date.now() - new Date(state.currentMessage.timestamp).getTime();
            const remainingTime = MAX_DISPLAY_TIME - elapsedTime;
            
            if (remainingTime > 1000) { // Se resta mais de 1 segundo
                // Define o histórico para que o carrossel funcione corretamente
                displayedHistory = state.displayedHistory; 
                startDisplay(state.currentMessage, remainingTime);
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
        log(`Recebida nova mensagem do servidor (ID: ${data.message.id}).`);
        totalMessages = data.totalMessages || 0;
        updateTotalMessagesDisplay();
        displayedHistory = data.history;
        startDisplay(data.message);
    });
    socket.on('enterWaitState', () => {
        log('Recebida instrução do servidor para entrar em modo de espera.');
        setScreenState('waiting');
    });
    socket.on('queueUpdate', (data) => {
        totalMessages = data.totalMessages || 0;
        updateTotalMessagesDisplay();
        queueCountSpan.textContent = data.count;
        queueCounterDiv.classList.toggle('hidden', data.count === 0);

        if (data.new && data.count > 0) {
            notificationSound.play();
            queueCounterDiv.classList.add('new-message');
            setTimeout(() => queueCounterDiv.classList.remove('new-message'), 300);
        }
    });
    socket.on('interruptDisplay', () => {
        log('Recebida instrução de interrupção do servidor.');
        if (messageStartTime) {
            const elapsedTime = Date.now() - messageStartTime;
            log(`Verificando tempo de interrupção. Tempo decorrido: ${elapsedTime}ms. Mínimo necessário: ${MIN_DISPLAY_TIME}ms.`);
            if (elapsedTime >= MIN_DISPLAY_TIME) {
                log('✅ Tempo mínimo de exibição atingido. Interrompendo para exibir a próxima.');
                finishDisplay();
            } else {
                log(`❌ Ainda dentro do tempo mínimo de exibição. ${MIN_DISPLAY_TIME - elapsedTime}ms restantes.`);
            }
        } else {
            log('⚠️ Tentativa de interrupção, mas nenhuma mensagem estava sendo exibida (messageStartTime nulo).');
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

    // --- Função para atualizar display de mensagens com singular/plural correto ---
    const updateTotalMessagesDisplay = () => {
        // Garante que totalMessages seja um número válido
        const count = totalMessages || 0;
        if (count === 1) {
            totalCountEl.textContent = `${count} mensagem enviada`;
        } else {
            totalCountEl.textContent = `${count} mensagens enviadas`;
        }
    };

    // --- Funções Auxiliares (QR Code, Font Size) ---
    const generateQRCode = () => {
        // Determina a URL correta baseada no ambiente
        let url = window.location.origin;
        if (window.location.hostname.includes('onrender.com')) {
            url = 'https://correio-elegante-bigbox.onrender.com';
        }
        console.log(`Gerando QR Code para URL: ${url}`);
        
        const qrCanvas = document.getElementById('qr-code');
        const qrCanvasSmall = document.getElementById('qr-code-small');
        const qrLoading = document.getElementById('qr-loading');
        
        if (qrLoading) qrLoading.style.display = 'block';

        const hideLoading = () => {
            if (qrLoading) qrLoading.style.display = 'none';
        };

        const createTextFallback = (canvas, textUrl) => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '16px Arial';
            ctx.fillText(textUrl, canvas.width / 2, canvas.height / 2);
            console.warn(`Fallback de TEXTO ativado para: ${textUrl}`);
            hideLoading();
        };

        const createApiFallback = (canvas, size) => {
            console.warn(`Biblioteca local falhou. Usando fallback de API para canvas ${size}x${size}.`);
            const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, size, size);
                console.log(`QR Code gerado via API para canvas ${size}x${size}.`);
                hideLoading();
            };
            img.onerror = () => {
                console.error(`Falha TOTAL. API e biblioteca falharam. Ativando fallback de TEXTO.`);
                createTextFallback(canvas, url);
            };
            img.src = apiUrl;
        };

        // Tenta usar a biblioteca local primeiro
        try {
            if (typeof QRCode === 'undefined') {
                throw new Error('Biblioteca QRCode não foi carregada.');
            }

            // QR Code grande
            if (qrCanvas) {
                QRCode.toCanvas(qrCanvas, url, { width: 300, margin: 2, errorCorrectionLevel: 'M' }, (error) => {
                    if (error) {
                        console.error('Erro ao gerar QR Code grande com a biblioteca:', error);
                        createApiFallback(qrCanvas, 300);
                    } else {
                        console.log('QR Code grande gerado com sucesso via biblioteca.');
                        hideLoading();
                    }
                });
            }

            // QR Code pequeno
            if (qrCanvasSmall) {
                QRCode.toCanvas(qrCanvasSmall, url, { width: 180, margin: 1, errorCorrectionLevel: 'M' }, (error) => {
                    if (error) {
                        console.error('Erro ao gerar QR Code pequeno com a biblioteca:', error);
                        createApiFallback(qrCanvasSmall, 180);
                    } else {
                        console.log('QR Code pequeno gerado com sucesso via biblioteca.');
                    }
                });
            }
        } catch (error) {
            console.error(error.message);
            // Se a biblioteca falhar totalmente, usa o fallback de API para ambos
            if (qrCanvas) createApiFallback(qrCanvas, 300);
            if (qrCanvasSmall) createApiFallback(qrCanvasSmall, 180);
        }
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