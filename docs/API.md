# 🔌 API Documentation

## 📋 Visão Geral

O Correio Elegante utiliza Socket.IO para comunicação em tempo real entre clientes e servidor.

## 🔗 Endpoints HTTP

### Páginas Principais
- `GET /` - Página de envio de mensagens
- `GET /display` - Telão de exibição
- `GET /login` - Página de login administrativo
- `GET /admin` - Painel administrativo principal
- `GET /history` - Histórico de mensagens
- `GET /clients` - Monitor de clientes
- `GET /stats` - Estatísticas do sistema

### APIs
- `GET /api/check-auth` - Verifica autenticação do admin

## 📡 Eventos Socket.IO

### Cliente → Servidor

#### `register`
Registra o cliente e informa a página atual.
```javascript
socket.emit('register', '/display');
```

#### `newMessage`
Envia uma nova mensagem.
```javascript
socket.emit('newMessage', {
  recipient: 'Nome do Destinatário',
  message: 'Texto da mensagem',
  sender: 'Nome do Remetente'
});
```

#### `messageDisplayed`
Informa que uma mensagem foi exibida no telão.
```javascript
socket.emit('messageDisplayed');
```

#### `getLog`
Solicita o histórico de mensagens (admin).
```javascript
socket.emit('getLog');
```

#### `getConfig`
Solicita configurações de mensagens.
```javascript
socket.emit('getConfig');
```

#### `updateConfig`
Atualiza configurações de mensagens (admin).
```javascript
socket.emit('updateConfig', {
  categories: ['Geral', 'Romântico'],
  messages: [
    { text: 'Mensagem exemplo', category: 'Geral' }
  ]
});
```

#### `blockIp`
Bloqueia um IP (admin).
```javascript
socket.emit('blockIp', '192.168.1.1');
```

#### `unblockIp`
Desbloqueia um IP (admin).
```javascript
socket.emit('unblockIp', '192.168.1.1');
```

### Servidor → Cliente

#### `initialState`
Envia o estado inicial do sistema.
```javascript
socket.on('initialState', (state) => {
  // state.displayedHistory - Histórico de mensagens exibidas
  // state.totalMessages - Total de mensagens
  // state.isBusy - Se o telão está ocupado
  // state.currentMessage - Mensagem atual sendo exibida
});
```

#### `displayMessage`
Envia uma nova mensagem para exibição.
```javascript
socket.on('displayMessage', (data) => {
  // data.message - Mensagem a ser exibida
  // data.history - Histórico atualizado
  // data.totalMessages - Total de mensagens
});
```

#### `enterWaitState`
Instrui para entrar no modo de espera.
```javascript
socket.on('enterWaitState', () => {
  // Ativar tela de espera com QR Code
});
```

#### `enterHistoryMode`
Instrui para entrar no modo memória.
```javascript
socket.on('enterHistoryMode', (data) => {
  // data.history - Mensagens para exibir
  // data.top5 - Top 5 destinatários
});
```

#### `queueUpdate`
Atualiza informações da fila.
```javascript
socket.on('queueUpdate', (data) => {
  // data.count - Número de mensagens na fila
  // data.totalMessages - Total de mensagens
  // data.new - Se é uma nova mensagem
});
```

#### `interruptDisplay`
Instrui para interromper a exibição atual.
```javascript
socket.on('interruptDisplay', () => {
  // Interromper exibição se tempo mínimo foi atingido
});
```

#### `updateConfig`
Atualiza configurações de mensagens.
```javascript
socket.on('updateConfig', (config) => {
  // config.categories - Categorias disponíveis
  // config.messages - Mensagens pré-definidas
});
```

#### `messageLog`
Envia histórico de mensagens (admin).
```javascript
socket.on('messageLog', (log) => {
  // log - Array com todas as mensagens
});
```

#### `clientsUpdate`
Atualiza lista de clientes (admin).
```javascript
socket.on('clientsUpdate', (data) => {
  // data.clients - Lista de clientes conectados
  // data.blocked - IPs bloqueados
});
```

#### `statsUpdate`
Atualiza estatísticas (admin).
```javascript
socket.on('statsUpdate', (stats) => {
  // stats.totalMessages - Total de mensagens
  // stats.popularMessages - Mensagens mais populares
  // stats.topRecipients - Destinatários mais homenageados
  // stats.currentClients - Clientes conectados
});
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
PORT=3000                    # Porta do servidor
ADMIN_PASSWORD=sua_senha     # Senha do admin
SESSION_SECRET=chave_secreta # Chave da sessão
GITHUB_TOKEN=token_github    # Token para logs (opcional)
GIST_ID=id_do_gist          # ID do Gist (opcional)
```

### Configuração de Mensagens
Arquivo `messages.json`:
```json
{
  "categories": ["Geral", "Romântico", "Amizade"],
  "messages": [
    {
      "text": "Sua beleza é como um bug no meu coração!",
      "category": "Romântico"
    }
  ]
}
```

## 🛡️ Segurança

### Autenticação
- Sessões baseadas em cookies
- Senha única para área administrativa
- Bloqueio de IPs maliciosos

### Validação
- Sanitização de entrada de dados
- Limitação de tamanho de mensagens
- Rate limiting implícito

### Logs
- Log local em `message_history.log`
- Log remoto via GitHub Gist (opcional)
- Auditoria completa de todas as operações

## 📊 Monitoramento

### Métricas Disponíveis
- Total de mensagens enviadas
- Mensagens na fila
- Clientes conectados
- Pico de conexões simultâneas
- Mensagens mais populares
- Destinatários mais homenageados

### Logs
- Timestamp de todas as operações
- IPs dos clientes
- User-Agent dos navegadores
- Erros e exceções
- Inicialização e shutdown do servidor 