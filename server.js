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

const logFilePath = path.join(__dirname, 'message_history.log');
const messagesFilePath = path.join(__dirname, 'messages.json');

// Middleware de autenticação
const checkAuth = (req, res, next) => {
    if (req.session.isAdmin) {
        return next();
    }
    res.redirect('/login.html');
};

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

io.on('connection', (socket) => {
    console.log('Um cliente se conectou');

    // Envia o estado atual da fila para o cliente que acabou de conectar
    socket.emit('queueUpdate', { count: messageQueue.length });

    // Envia as mensagens prontas para o cliente que acabou de conectar
    socket.emit('updateMessages', predefinedMessages);

    // O envio automático de log na conexão foi removido para maior segurança e eficiência.
    // O cliente de admin agora solicitará o log.

    socket.on('getLog', () => {
        socket.emit('messageLog', messageLog);
    });

    socket.on('newMessage', (msg) => {
        console.log('Nova mensagem recebida:', msg);

        // Captura o endereço IP do remetente
        const ip = socket.handshake.address.includes('::') 
            ? socket.handshake.address.split(':').pop()
            : socket.handshake.address;

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

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

server.listen(PORT, () => {
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`- Envio de Mensagens: ${baseUrl}`);
    console.log(`- Telão: ${baseUrl}/display`);
    console.log(`- Administração: ${baseUrl}/admin`);
}); 