const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const cookieSession = require('cookie-session');
const useragent = require('express-useragent');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bigbox';
const SESSION_SECRET = process.env.SESSION_SECRET || 'mude-esta-chave-secreta-depois';

// Aviso se estiver usando valores padrão em produção
if (process.env.NODE_ENV === 'production') {
    if (!process.env.ADMIN_PASSWORD) {
        console.warn('⚠️  AVISO: Usando senha padrão em produção. Defina ADMIN_PASSWORD como variável de ambiente.');
    }
    if (!process.env.SESSION_SECRET) {
        console.warn('⚠️  AVISO: Usando chave de sessão padrão em produção. Defina SESSION_SECRET como variável de ambiente.');
    }
}

// Configuração da Sessão
app.use(cookieSession({
    name: 'session',
    keys: [SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
}));

app.use(helmet());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para parsear o formulário de login
app.use(useragent.express()); // Usar o middleware user-agent

let messageQueue = [];
let isDisplayBusy = false;
let messageLog = [];
// Mantém apenas as últimas N mensagens em memória para enviar aos clientes.
// O histórico completo continua salvo em "message_history.log".
const MAX_LOG_SIZE = parseInt(process.env.MAX_LOG_SIZE, 10) || 100;
let connectedClients = {}; // Para rastrear clientes
let blockedIps = new Set(); // Para armazenar IPs bloqueados
let displayedMessagesLog = []; // Histórico para o carrossel
let currentDisplayMode = 'default'; // Modos: 'default', 'carousel', 'ticker'
let currentMessage = null; // Rastreia a mensagem atualmente em exibição

// Estrutura para Estatísticas
const stats = {
    pageAccessCounts: {},
    predefinedMessageCounts: {},
    peakConcurrentClients: 0,
    popularMessages: [],
    topRecipients: []
};

const logFilePath = path.join(__dirname, 'message_history.log');
const messagesFilePath = path.join(__dirname, 'messages.json');

// Middleware de autenticação
const checkAuth = (req, res, next) => {
    if (req.session.isAdmin) {
        return next();
    }
    res.redirect('/login');
};

// Função para normalizar o endereço IP
const normalizeIp = (ip) => {
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        return '127.0.0.1';
    }
    return ip;
};

// Middleware para verificar IPs bloqueados (para rotas HTTP)
const checkBlockedHttp = (req, res, next) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    let ip = forwardedFor ? forwardedFor.split(',')[0].trim() : req.socket.remoteAddress;
    ip = normalizeIp(ip);
    
    if (blockedIps.has(ip)) {
        return res.status(403).send('Acesso negado.');
    }
    next();
};

// Aplicar o middleware de bloqueio a todas as rotas
app.use(checkBlockedHttp);

// Rota GET para a página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota de Login
app.post('/login', (req, res) => {
    const inputPassword = req.body.password;
    console.log(`Tentativa de login:`);
    console.log(`- Senha enviada: "${inputPassword}"`);
    console.log(`- Senha esperada: "${ADMIN_PASSWORD}"`);
    console.log(`- Senhas iguais: ${inputPassword === ADMIN_PASSWORD}`);
    console.log(`- Tipo senha enviada: ${typeof inputPassword}`);
    console.log(`- Tipo senha esperada: ${typeof ADMIN_PASSWORD}`);
    
    if (inputPassword === ADMIN_PASSWORD) {
        console.log('✅ Login bem-sucedido!');
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        console.log('❌ Login falhou - senha incorreta');
        res.redirect('/login?error=1');
    }
});

// Protegendo a rota do admin.
// A rota agora é '/admin' para não ser servida diretamente pelo 'express.static'
app.get('/admin', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

// Nova rota para a página de monitoramento de clientes
app.get('/clients', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'clients.html'));
});

// Nova rota para a página de estatísticas
app.get('/stats', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'stats.html'));
});

// Nova rota para a página de display para ter uma URL mais limpa
app.get('/display', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

// Nova rota para a página de histórico
app.get('/history', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'history.html'));
});

// Nova rota de API para buscar o conteúdo do log, agora processado
app.get('/api/history', checkAuth, (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') { // Se o arquivo não existe, retorna vazio
                return res.json({ log: [] });
            }
            console.error('Erro ao ler arquivo de log:', err);
            return res.status(500).json({ error: 'Erro ao ler o log.' });
        }
        const logEntries = data.split('\n').filter(Boolean).reverse(); // Inverte para o mais novo primeiro
        res.json({ log: logEntries });
    });
});

// Rota para baixar o log
app.get('/download-log', checkAuth, (req, res) => {
    res.download(logFilePath, 'correio-elegante-historico.log', (err) => {
        if (err) {
            // Se o arquivo não existir, envia uma mensagem amigável
            if (err.code === 'ENOENT') {
                return res.status(404).send('Nenhum histórico para baixar ainda.');
            }
            console.error("Erro ao baixar o log:", err);
            res.status(500).send("Não foi possível baixar o log.");
        }
    });
});

// Rota para limpar o log
app.post('/clear-log', checkAuth, (req, res) => {
    fs.truncate(logFilePath, 0, (err) => {
        if (err && err.code !== 'ENOENT') { // Ignora erro se o arquivo não existe
            console.error("Erro ao limpar o log:", err);
            return res.status(500).json({ success: false, message: "Falha ao limpar o histórico." });
        }
        console.log('Histórico de mensagens limpo pelo administrador.');
        res.json({ success: true, message: "Histórico limpo com sucesso!" });
    });
});

// Rota de Logout
app.get('/logout', (req, res) => {
    req.session = null; // Destrói a sessão
    res.redirect('/login');
});

// Função para salvar uma mensagem no arquivo de log
const appendToLogFile = (message) => {
    const timestamp = new Date(message.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    // Melhor detecção de dispositivo usando user-agent
    const userAgent = message.userAgent || '';
    const ua = useragent.parse(userAgent);
    let deviceInfo = 'Desconhecido';
    
    try {
        if (ua.isMobile) {
            const deviceName = (ua.device && ua.device.family) ? ua.device.family : 'Celular';
            const osName = (ua.os && ua.os.family) ? ua.os.family : 'Mobile';
            deviceInfo = `📱 ${deviceName} - ${osName}`;
        } else if (ua.isDesktop) {
            const browserName = (ua.browser && ua.browser.family) ? ua.browser.family : 'Desktop';
            const osName = (ua.os && ua.os.family) ? ua.os.family : 'Desktop';
            deviceInfo = `💻 ${browserName} - ${osName}`;
        } else if (ua.isTablet) {
            const deviceName = (ua.device && ua.device.family) ? ua.device.family : 'Tablet';
            const osName = (ua.os && ua.os.family) ? ua.os.family : 'Tablet';
            deviceInfo = `📱 ${deviceName} - ${osName}`;
        }
        
        // Adiciona informações do navegador se disponível
        if (ua.browser && ua.browser.family && ua.browser.major) {
            deviceInfo += ` (${ua.browser.family} ${ua.browser.major})`;
        }
    } catch (error) {
        console.error('Erro ao processar user-agent:', error);
        deviceInfo = '📱 Dispositivo Móvel';
    }
    
    const logEntry = `[${timestamp}] [IP: ${message.ip}] [${deviceInfo}] Para: "${message.recipient}" | De: "${message.sender}" | Mensagem: "${message.message}"\n`;
    
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Erro ao escrever no arquivo de log:', err);
        }
    });
};

// Função para ler as mensagens prontas do arquivo
const readPredefinedMessages = async () => {
    try {
        const data = await fsPromises.readFile(messagesFilePath, 'utf8');
        try {
            return JSON.parse(data);
        } catch (parseError) {
            console.error('Erro ao fazer parse de messages.json:', parseError);
        }
    } catch (readError) {
        if (readError.code !== 'ENOENT') {
            console.error('Erro ao ler messages.json:', readError);
        }
    }
    // Retorna mensagens padrão se o arquivo não existir ou der erro
    return [
        "Sua beleza é como um bug no meu coração, impossível de ignorar!",
        "Se beleza desse cadeia, você pegaria prisão perpétua.",
        "Você não é o Google, mas tem tudo que eu procuro.",
        "Meu amor por você é como a inflação, só aumenta!",
        "Se eu fosse um sistema operacional, seu sorriso seria minha tela de boot."
    ];
};

let predefinedMessages = [];

(async () => {
    predefinedMessages = await readPredefinedMessages();
})();

// Função para processar a fila de mensagens
const processQueue = () => {
    if (messageQueue.length > 0 && !isDisplayBusy) {
        isDisplayBusy = true;
        
        const nextMessage = messageQueue.shift();
        currentMessage = nextMessage; // Armazena a mensagem atual

        // Adiciona ao histórico de exibidas ANTES de enviar
        displayedMessagesLog.push(nextMessage);
        // Mantém o histórico com um tamanho razoável, ex: últimas 50 mensagens
        if (displayedMessagesLog.length > 50) {
            displayedMessagesLog.shift();
        }

        io.emit('displayMessage', { 
            message: nextMessage, 
            history: displayedMessagesLog,
            totalMessages: messageLog ? messageLog.length : 0 // Garante que seja um número
        });
        io.emit('queueUpdate', { 
            count: messageQueue.length, 
            totalMessages: messageLog ? messageLog.length : 0 // Garante que seja um número
        }); // Atualiza o contador para todos após remover
    }
};

// Função para mapear páginas para nomes amigáveis
const getPageDisplayName = (page) => {
    const pageMap = {
        '/': 'Envio de Mensagens',
        '/display': 'Telão',
        '/admin': 'Administração',
        '/history': 'Histórico',
        '/clients': 'Monitor de Clientes',
        '/stats': 'Estatísticas',
        '/login': 'Login',
        'clients_admin': 'Monitor de Clientes',
        'stats_admin': 'Estatísticas',
        'Conectando...': 'Conectando...',
        'Página Desconhecida': 'Página Desconhecida'
    };
    return pageMap[page] || page;
};

// Função para enviar a lista de clientes atualizada para o admin de clientes
const updateClientsAdmin = () => {
    const clientsData = Object.values(connectedClients).map(client => {
        const ua = useragent.parse(client.userAgent || '');
        return {
            ip: client.ip,
            page: getPageDisplayName(client.page),
            device: ua.isMobile ? 'Celular' : (ua.isDesktop ? 'Computador' : 'Outro'),
            connectedAt: client.connectedAt
        };
    });

    const payload = {
        clients: clientsData,
        blocked: Array.from(blockedIps)
    };
    io.to('clients_admin_room').emit('clientsUpdate', payload);
};

// Função para enviar as estatísticas atualizadas
const updateStatsAdmin = async () => {
    try {
        const data = await fsPromises.readFile(logFilePath, 'utf8');
        const lines = data.split('\n').filter(Boolean);
        
        // Calcular mensagens populares
        const messageCounts = {};
        lines.forEach(line => {
            const match = line.match(/Mensagem: "([^"]*)"/);
            if (match && match[1]) {
                const msg = match[1];
                messageCounts[msg] = (messageCounts[msg] || 0) + 1;
            }
        });
        const sortedMessages = Object.entries(messageCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        stats.popularMessages = sortedMessages.map(([message, count]) => ({ message, count }));

        // Calcular destinatários mais populares
        const recipientCounts = {};
        lines.forEach(line => {
            const match = line.match(/Para: "([^"]*)"/);
            if (match && match[1]) {
                const recipient = match[1];
                recipientCounts[recipient] = (recipientCounts[recipient] || 0) + 1;
            }
        });
        const sortedRecipients = Object.entries(recipientCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        stats.topRecipients = sortedRecipients.map(([name, count]) => ({ name, count }));

        stats.totalMessages = lines.length;

    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error("Erro ao processar estatísticas:", err);
        }
        // Garante que as propriedades existam mesmo com erro
        stats.popularMessages = [];
        stats.topRecipients = [];
        stats.totalMessages = 0;
    }

    // Adiciona o número atual de clientes conectados
    stats.currentClients = Object.keys(connectedClients).length;

    // Garante que totalMessages do messageLog seja sempre um número
    const totalFromLog = messageLog ? messageLog.length : 0;

    io.to('stats_admin_room').emit('statsUpdate', stats);
};

io.on('connection', (socket) => {
    const forwardedFor = socket.handshake.headers['x-forwarded-for'];
    let ip = forwardedFor ? forwardedFor.split(',')[0].trim() : socket.handshake.address;
    ip = normalizeIp(ip);

    // Middleware de bloqueio para Socket.IO
    if (blockedIps.has(ip)) {
        console.log(`Conexão recusada do IP bloqueado: ${ip}`);
        return socket.disconnect();
    }
    
    console.log(`Um cliente se conectou com o IP: ${ip}`);

    // Registro inicial do cliente (será atualizado pelo evento 'register')
    connectedClients[socket.id] = {
        id: socket.id,
        ip: ip,
        page: 'Conectando...',
        userAgent: socket.handshake.headers['user-agent'] || 'N/A',
        connectedAt: new Date()
    };
    
    // Timeout para detectar páginas que não se registram em 5 segundos
    setTimeout(() => {
        if (connectedClients[socket.id] && connectedClients[socket.id].page === 'Conectando...') {
            // Tenta detectar a página pela URL do referer
            const referer = socket.handshake.headers.referer;
            if (referer) {
                try {
                    const url = new URL(referer);
                    connectedClients[socket.id].page = url.pathname || 'Página Desconhecida';
                } catch (e) {
                    connectedClients[socket.id].page = 'Página Desconhecida';
                }
            } else {
                connectedClients[socket.id].page = 'Página Desconhecida';
            }
            updateClientsAdmin();
        }
    }, 5000);
    
    // Atualiza o pico de clientes conectados
    const currentClientCount = Object.keys(connectedClients).length;
    if (currentClientCount > stats.peakConcurrentClients) {
        stats.peakConcurrentClients = currentClientCount;
    }

    // Envia o modo de exibição atual para o cliente que acabou de se conectar
    // Útil principalmente para admin e display
    socket.emit('initialState', { 
        displayMode: currentDisplayMode,
        displayedHistory: displayedMessagesLog,
        totalMessages: messageLog ? messageLog.length : 0,
        isBusy: isDisplayBusy,
        currentMessage: currentMessage // Envia a mensagem atual se houver
    });

    updateClientsAdmin();
    updateStatsAdmin();

    // Envia o estado atual da fila para o cliente que acabou de conectar
    socket.emit('queueUpdate', { 
        count: messageQueue.length, 
        totalMessages: messageLog ? messageLog.length : 0
    });

    // Envia as mensagens prontas para o cliente que acabou de conectar
    socket.emit('updateMessages', predefinedMessages);

    // O envio automático de log na conexão foi removido para maior segurança e eficiência.
    // O cliente de admin agora solicitará o log.

    socket.on('getLog', () => {
        socket.emit('messageLog', messageLog);
    });

    // Evento para o cliente se registrar e informar a página
    socket.on('register', (page) => {
        if (connectedClients[socket.id]) {
            connectedClients[socket.id].page = page;
        }

        // Contabiliza acesso à página
        stats.pageAccessCounts[page] = (stats.pageAccessCounts[page] || 0) + 1;

        // Se for a página de monitoramento, coloca numa sala especial
        if (page === 'clients_admin') {
            socket.join('clients_admin_room');
            // Envia a lista completa assim que ele se registra
            updateClientsAdmin();
        }
        // Se for a página de estatísticas, coloca numa sala especial
        if (page === 'stats_admin') {
            socket.join('stats_admin_room');
            updateStatsAdmin(); // Envia os dados atuais
        }
        if (page === '/display') {
            socket.join('display_room');
            console.log('Cliente de telão se conectou e foi adicionado à sala.');
            
            // Envia o estado atual completo para o novo cliente de telão
            socket.emit('initialState', { 
                displayMode: currentDisplayMode,
                displayedHistory: displayedMessagesLog,
                totalMessages: messageLog ? messageLog.length : 0, // Garante que seja um número
                isBusy: isDisplayBusy,
                currentMessage: currentMessage // Envia a mensagem atual se houver
            });
        }
        updateClientsAdmin();
        updateStatsAdmin();
    });

    socket.on('newMessage', (msg) => {
        console.log('Nova mensagem recebida:', msg);

        // Verifica se a mensagem é uma das predefinidas
        if (predefinedMessages.includes(msg.message)) {
            stats.predefinedMessageCounts[msg.message] = (stats.predefinedMessageCounts[msg.message] || 0) + 1;
        }

        // A obtenção de IP já foi feita na conexão
        const fullMessage = { 
            ...msg, 
            id: Date.now(), 
            timestamp: new Date(), 
            ip: ip,
            userAgent: socket.handshake.headers['user-agent'] || 'N/A'
        };
        messageQueue.push(fullMessage);
        messageLog.push(fullMessage);
        // Garante que apenas as últimas MAX_LOG_SIZE mensagens permaneçam em memória
        while (messageLog.length > MAX_LOG_SIZE) {
            messageLog.shift();
        }
        appendToLogFile(fullMessage);
        
        // Notifica que uma NOVA mensagem chegou e atualiza a contagem
        io.emit('queueUpdate', { 
            count: messageQueue.length, 
            new: true, 
            totalMessages: messageLog ? messageLog.length : 0 // Garante que seja um número
        });

        // Se o telão estiver ocupado, comanda a interrupção para acelerar a fila
        if (isDisplayBusy) {
            io.emit('interruptDisplay');
        }

        io.emit('messageLog', messageLog);
        processQueue();
    });

    socket.on('messageDisplayed', () => {
        isDisplayBusy = false;
        currentMessage = null; // Limpa a mensagem atual
        console.log('Telão liberado. Processando próxima mensagem se houver.');
        processQueue();
    });

    socket.on('getMessages', () => {
        socket.emit('updateMessages', predefinedMessages);
    });

    socket.on('updateMessages', async (newMessages) => {
        predefinedMessages = newMessages;
        try {
            await fsPromises.writeFile(messagesFilePath, JSON.stringify(newMessages, null, 2));
            console.log('Mensagens prontas atualizadas e salvas.');
            io.emit('updateMessages', predefinedMessages); // Envia para todos os clientes
        } catch (error) {
            console.error('Erro ao salvar messages.json:', error);
        }
    });

    // Novo evento para definir o modo de exibição
    socket.on('setDisplayMode', (mode) => {
        if (['default', 'carousel', 'ticker'].includes(mode)) {
            currentDisplayMode = mode;
            console.log(`Modo de exibição alterado para: ${mode}`);
            // Envia a atualização para todos, incluindo os painéis de admin
            io.emit('modeUpdate', currentDisplayMode);
        }
    });

    // Novo evento para bloquear um IP
    socket.on('blockIp', (ipToBlock) => {
        if (ipToBlock) {
            blockedIps.add(ipToBlock);
            console.log(`IP ${ipToBlock} bloqueado pelo administrador.`);

            // Desconecta todos os sockets com este IP
            for (const id in connectedClients) {
                if (connectedClients[id].ip === ipToBlock) {
                    const socketToDisconnect = io.sockets.sockets.get(id);
                    if (socketToDisconnect) {
                        socketToDisconnect.emit('blocked', 'Seu acesso foi revogado.');
                        socketToDisconnect.disconnect(true);
                    }
                }
            }
            updateClientsAdmin(); // Atualiza a lista de bloqueados para os admins
        }
    });

    // Novo evento para desbloquear um IP
    socket.on('unblockIp', (ipToUnblock) => {
        if (ipToUnblock) {
            blockedIps.delete(ipToUnblock);
            console.log(`IP ${ipToUnblock} desbloqueado pelo administrador.`);
            updateClientsAdmin(); // Atualiza a lista de bloqueados para os admins
        }
    });

    socket.on('disconnect', () => {
        console.log(`Cliente ${socket.id} (IP: ${ip}) desconectado.`);
        delete connectedClients[socket.id];
        updateClientsAdmin();
        updateStatsAdmin();
    });

    // Evento para quando um admin entra na página de monitoramento
    socket.on('join_clients_admin', () => {
        socket.join('clients_admin_room');
        console.log('Um admin entrou na sala de monitoramento');
        updateClientsAdmin();
    });

    // Evento para quando um admin entra na página de estatísticas
    socket.on('join_stats_admin', () => {
        socket.join('stats_admin_room');
        console.log('Um admin entrou na sala de estatísticas');
        // Envia os dados atuais imediatamente para o novo admin
        updateStatsAdmin();
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log("---------------------------------------");
    console.log("Páginas disponíveis:");
    console.log(`- Envio de Mensagens: ${baseUrl}`);
    console.log(`- Telão: ${baseUrl}/display`);
    console.log(`- Login Admin: ${baseUrl}/login`);
    console.log("---------------------------------------");
    console.log("Área de Administração (requer login):");
    console.log(`- Painel Principal: ${baseUrl}/admin`);
    console.log(`- Histórico: ${baseUrl}/history`);
    console.log(`- Monitoramento: ${baseUrl}/clients`);
    console.log(`- Estatísticas: ${baseUrl}/stats`);
    console.log("---------------------------------------");
    if (process.env.RENDER_EXTERNAL_URL) {
        console.log(`URL Pública (se aplicável): ${process.env.RENDER_EXTERNAL_URL}`);
    }
}); 