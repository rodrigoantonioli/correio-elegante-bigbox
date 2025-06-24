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

    // --- Elementos do Modo Padrão ---
    const defaultRecipientSpan = document.getElementById('display-recipient');
    const defaultMessageSpan = document.getElementById('display-message');
    const defaultSenderSpan = document.getElementById('display-sender');

    // --- Estado do Display ---
    let displayedHistory = [];
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
        }).catch(() => {});
        
        // Atualiza o display de mensagens inicialmente
        updateTotalMessagesDisplay();
        
        // Gera o QR code com um pequeno delay para garantir que a UI esteja pronta
        setTimeout(generateQRCode, 100);
    };

    startButton.addEventListener('click', initializeDisplay, { once: true });

    // --- Gerenciamento de Estado da Tela ---
    const setScreenState = (state) => {
        log(`Transicionando para o estado de '${state}'.`);
        // Oculta todas as telas principais
        waitingScreen.classList.add('hidden');
        messageScreen.classList.add('hidden');
        historyPlaybackScreen.classList.add('hidden');

        // Para qualquer animação em andamento
        if (historyAnimationInterval) {
            clearInterval(historyAnimationInterval);
            historyAnimationInterval = null;
        }

        if (state === 'waiting') {
            waitingScreen.classList.remove('hidden');
            startIncentiveCycle();
        } else if (state === 'message') {
            messageScreen.classList.remove('hidden');
            displayWrapper.classList.remove('hidden');
            stopIncentiveCycle();
        } else if (state === 'history') {
            historyPlaybackScreen.classList.remove('hidden');
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

        // Adiciona a hora formatada
        const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const timeEl = document.createElement('p');
        timeEl.className = 'timestamp';
        timeEl.textContent = `Enviado às ${time}`;
        // Limpa timestamp antigo e adiciona o novo
        const oldTime = defaultMessageSpan.parentNode.querySelector('.timestamp');
        if(oldTime) oldTime.remove();
        defaultMessageSpan.parentNode.appendChild(timeEl);

        adjustFontSize(defaultMessageSpan, msg.message);
    };

    // --- Controle de Exibição ---

    const startDisplay = (msg, duration) => {
        setScreenState('message');
        renderDefault(msg);
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
        displayedHistory = state.displayedHistory || [];
        totalMessages = state.totalMessages || 0; // Garante que seja um número
        updateTotalMessagesDisplay();

        // Se o telão estava ocupado quando reconectamos, retoma a exibição
        if (state.isBusy && state.currentMessage) {
            
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
    socket.on('enterHistoryMode', (data) => {
        log('Recebida instrução do servidor para entrar em modo de memórias.');
        renderHistoryScreen(data.history);
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

        
        const qrCanvas = document.getElementById('qr-code');
        const qrCanvasSmall = document.getElementById('qr-code-small');
        const qrLoading = document.getElementById('qr-loading');
        
        if (qrLoading) qrLoading.classList.remove('hidden');

        const hideLoading = () => {
            if (qrLoading) qrLoading.classList.add('hidden');
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

    const historyPlaybackScreen = document.getElementById('history-playback-screen');
    const historyContainer = document.getElementById('history-messages-container');
    let historyAnimationInterval = null;

    const renderHistoryScreen = (history) => {
        setScreenState('history');
        historyContainer.innerHTML = '';
        if (!history || history.length === 0) return;

        // Gera o QR Code para o painel superior
        const qrCanvasHistory = document.getElementById('qr-code-history');
        if (qrCanvasHistory) {
            let url = window.location.origin;
            if (window.location.hostname.includes('onrender.com')) {
                url = 'https://correio-elegante-bigbox.onrender.com';
            }
            QRCode.toCanvas(qrCanvasHistory, url, { width: 100, margin: 1, errorCorrectionLevel: 'Q' }, (e) => {
                if (e) console.error("Erro ao gerar QR de histórico:", e);
            });
        }

        const numColumns = Math.min(Math.floor(window.innerWidth / 500), 4);
        const columns = [];
        for (let i = 0; i < numColumns; i++) {
            const colDiv = document.createElement('div');
            colDiv.className = 'history-column';
            columns.push(colDiv);
            historyContainer.appendChild(colDiv);
        }

        // Distribui as mensagens nas colunas
        history.forEach((msg, index) => {
            const colIndex = index % numColumns;
            columns[colIndex].appendChild(createHistoryCard(msg));
        });
    };

    const createHistoryCard = (msg) => {
        const card = document.createElement('div');
        card.className = 'history-message-card';
        
        const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        card.innerHTML = `
            <p class="recipient">Para: <strong>${msg.recipient}</strong></p>
            <p class="message">"${msg.message}"</p>
            <p class="sender">De: <strong>${msg.sender}</strong></p>
            <p class="timestamp">${time}</p>
        `;
        return card;
    };
}); 