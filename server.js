const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const cookieSession = require('cookie-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bigbox';
const SESSION_SECRET = process.env.SESSION_SECRET || 'mude-esta-chave-secreta-depois';

// Configuração da Sessão
app.use(cookieSession({
    name: 'session',
    keys: [SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para parsear o formulário de login

let messageQueue = [];
let isDisplayBusy = false;
let messageLog = [];
let connectedClients = {}; // Para rastrear clientes
let blockedIps = new Set(); // Para armazenar IPs bloqueados

// Estrutura para Estatísticas
const stats = {
    pageAccessCounts: {},
    predefinedMessageCounts: {},
    peakConcurrentClients: 0,
    clientsOverTime: [] // Formato: { time: Date, count: Number }
};

const logFilePath = path.join(__dirname, 'message_history.log');
const messagesFilePath = path.join(__dirname, 'messages.json');

// Middleware de autenticação
const checkAuth = (req, res, next) => {
    if (req.session.isAdmin) {
        return next();
    }
    res.redirect('/login.html');
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

// Rota de Login
app.post('/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.redirect('/login.html');
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

// Nova rota de API para buscar o conteúdo do log
app.get('/api/history', checkAuth, (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler arquivo de log:', err);
            return res.status(500).send('Erro ao ler o log.');
        }
        res.type('text/plain').send(data);
    });
});

// Rota de Logout
app.get('/logout', (req, res) => {
    req.session = null; // Destrói a sessão
    res.redirect('/login.html');
});

// Função para salvar uma mensagem no arquivo de log
const appendToLogFile = (message) => {
    const timestamp = new Date(message.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const logEntry = `[${timestamp}] [IP: ${message.ip}] Para: "${message.recipient}" | De: "${message.sender}" | Mensagem: "${message.message}"\n`;
    
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Erro ao escrever no arquivo de log:', err);
        }
    });
};

// Função para ler as mensagens prontas do arquivo
const readPredefinedMessages = () => {
    try {
        if (fs.existsSync(messagesFilePath)) {
            const data = fs.readFileSync(messagesFilePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao ler messages.json:', error);
    }
    // Retorna mensagens padrão se o arquivo não existir ou derro
    return [
        "Sua beleza é como um bug no meu coração, impossível de ignorar!",
        "Se beleza desse cadeia, você pegaria prisão perpétua.",
        "Você não é o Google, mas tem tudo que eu procuro.",
        "Meu amor por você é como a inflação, só aumenta!",
        "Se eu fosse um sistema operacional, seu sorriso seria minha tela de boot."
    ];
};

let predefinedMessages = readPredefinedMessages();

// Função para processar a fila de mensagens
const processQueue = () => {
    if (messageQueue.length > 0 && !isDisplayBusy) {
        isDisplayBusy = true;
        
        // Define a duração ANTES de remover o item da fila.
        // 20s se houver mais de uma mensagem (ou seja, sobrará fila), 60s se for a última.
        const duration = messageQueue.length > 1 ? 20000 : 60000; 

        const nextMessage = messageQueue.shift();
        const messageToSend = { ...nextMessage, duration };
        
        io.emit('displayMessage', messageToSend);
        io.emit('queueUpdate', { count: messageQueue.length }); // Atualiza o contador para todos após remover
    }
};

// Função para enviar a lista de clientes atualizada para o admin de clientes
const updateClientsAdmin = () => {
    const clientsByIp = {};
    for (const client of Object.values(connectedClients)) {
        if (!clientsByIp[client.ip]) {
            clientsByIp[client.ip] = {
                ip: client.ip,
                pages: new Set() // Usar Set para evitar páginas duplicadas se o cliente reconectar rápido
            };
        }
        clientsByIp[client.ip].pages.add(client.page);
    }

    const groupedClients = Object.values(clientsByIp).map(group => ({
        ...group,
        pages: Array.from(group.pages) // Converter Set para Array para enviar via JSON
    }));

    const payload = {
        clients: groupedClients,
        blocked: Array.from(blockedIps)
    };
    io.to('clients_admin_room').emit('clientsUpdate', payload);
};

// Função para enviar as estatísticas atualizadas
const updateStatsAdmin = () => {
    io.to('stats_admin_room').emit('statsUpdate', stats);
};

// Inicia a coleta de dados para o gráfico
setInterval(() => {
    stats.clientsOverTime.push({
        time: new Date(),
        count: Object.keys(connectedClients).length
    });
    // Mantém apenas os últimos 60 pontos (1 hora de dados)
    if (stats.clientsOverTime.length > 60) {
        stats.clientsOverTime.shift();
    }
    updateStatsAdmin();
}, 60 * 1000); // A cada minuto

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
    connectedClients[socket.id] = { id: socket.id, ip: ip, page: 'Conectando...' };
    
    // Atualiza o pico de clientes conectados
    const currentClientCount = Object.keys(connectedClients).length;
    if (currentClientCount > stats.peakConcurrentClients) {
        stats.peakConcurrentClients = currentClientCount;
    }

    updateClientsAdmin();
    updateStatsAdmin();

    // Envia o estado atual da fila para o cliente que acabou de conectar
    socket.emit('queueUpdate', { count: messageQueue.length });

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
        const fullMessage = { ...msg, id: Date.now(), timestamp: new Date(), ip: ip };
        messageQueue.push(fullMessage);
        messageLog.push(fullMessage);
        appendToLogFile(fullMessage);
        
        // Notifica que uma NOVA mensagem chegou e atualiza a contagem
        io.emit('queueUpdate', { count: messageQueue.length, new: true });

        // Se o telão estiver ocupado, comanda a interrupção para acelerar a fila
        if (isDisplayBusy) {
            io.emit('interruptDisplay');
        }

        io.emit('messageLog', messageLog);
        processQueue();
    });

    socket.on('messageDisplayed', () => {
        console.log('Telão terminou de exibir a mensagem.');
        isDisplayBusy = false;
        processQueue(); // Remove o delay de 2 segundos para a próxima mensagem ser imediata
    });

    socket.on('getMessages', () => {
        socket.emit('updateMessages', predefinedMessages);
    });

    socket.on('updateMessages', (newMessages) => {
        predefinedMessages = newMessages;
        try {
            fs.writeFileSync(messagesFilePath, JSON.stringify(newMessages, null, 2));
            console.log('Mensagens prontas atualizadas e salvas.');
            io.emit('updateMessages', predefinedMessages); // Envia para todos os clientes
        } catch (error) {
            console.error('Erro ao salvar messages.json:', error);
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
});

server.listen(PORT, () => {
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`- Envio de Mensagens: ${baseUrl}`);
    console.log(`- Telão: ${baseUrl}/display`);
    console.log(`- Administração: ${baseUrl}/admin`);
    console.log(`- Monitoramento: ${baseUrl}/clients`);
    console.log(`- Estatísticas: ${baseUrl}/stats`);
}); 