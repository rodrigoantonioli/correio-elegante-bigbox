# 💌 Correio Elegante - Big Arraiá Ultra Bão

Sistema de correio elegante para eventos, com telão interativo e modo memória animado.

## 🚀 Status: Pronto para Produção

O sistema está completamente funcional e otimizado para uso em eventos reais.

## ✨ Funcionalidades Principais

### 📱 Envio de Mensagens
- Formulário simples e intuitivo
- QR Code para acesso rápido via celular
- Mensagens anônimas e personalizadas
- Categorias de mensagens configuráveis

### 🖥️ Telão Interativo
- Exibição automática de mensagens
- Modo de espera com QR Code
- Modo memória com animações divertidas
- Controles manuais via atalhos de teclado

### 🎨 Modo Memória Melhorado
- **Fundo animado** com gradientes coloridos
- **Cards coloridos** com gradientes aleatórios
- **Animações de entrada** variadas
- **Emojis flutuantes** decorativos
- **Efeitos de hover** interativos
- **Controle manual** via F9/F10

### 🔧 Painel Administrativo
- Monitoramento de clientes conectados
- Estatísticas em tempo real
- Histórico de mensagens
- Configuração de categorias

## 🎮 Controles do Telão

### Atalhos de Teclado:
- **F9**: Ativa o modo memória (se houver mensagens)
- **F10**: Volta ao modo de espera

### Modo Automático:
- Ativa após 1 minuto sem mensagens
- Dura 1 minuto no modo memória
- Volta automaticamente ao modo de espera

## 🛠️ Instalação e Uso

### Pré-requisitos
- Node.js 14+
- NPM ou Yarn

### Instalação
```bash
npm install
```

### Execução
```bash
npm start
```

### Acesso
- **Envio de Mensagens**: `http://localhost:3000`
- **Telão**: `http://localhost:3000/display`
- **Admin**: `http://localhost:3000/login`

## 📁 Estrutura do Projeto

```
CorreioElegante/
├── public/                 # Arquivos públicos
│   ├── css/               # Estilos
│   ├── js/                # JavaScript do cliente
│   ├── images/            # Imagens
│   ├── audio/             # Sons
│   ├── index.html         # Página principal
│   ├── display.html       # Telão
│   └── login.html         # Login admin
├── private/               # Páginas administrativas
├── server.js              # Servidor principal
├── messages.json          # Configuração de mensagens
└── package.json           # Dependências
```

## 🎯 Configuração

### Mensagens Pré-definidas
Edite `messages.json` para configurar categorias e mensagens sugeridas:

```json
{
  "categories": ["Geral", "Romântico", "Amizade"],
  "messages": [
    {"text": "Sua beleza é como um bug no meu coração!", "category": "Romântico"},
    {"text": "Você é incrível!", "category": "Amizade"}
  ]
}
```

### Variáveis de Ambiente
- `PORT`: Porta do servidor (padrão: 3000)
- `NODE_ENV`: Ambiente (development/production)

## 🔒 Segurança

- **Autenticação** para área administrativa
- **Bloqueio de IPs** maliciosos
- **Validação** de entrada de dados
- **Rate limiting** implícito

## 📊 Monitoramento

### Estatísticas Disponíveis
- Total de mensagens enviadas
- Mensagens mais populares
- Destinatários mais homenageados
- Clientes conectados em tempo real
- Pico de conexões simultâneas

### Logs
- Logs detalhados de todas as operações
- Histórico de mensagens persistente
- Monitoramento de erros

## 🎨 Personalização

### Cores e Temas
As cores principais são definidas em `public/css/style.css`:
- `--primary-color`: Cor principal
- `--accent-color`: Cor de destaque
- `--text-color`: Cor do texto

### Logo
Substitua `public/images/logo.png` pelo logo do seu evento.

## 🚀 Deploy

### Render.com (Recomendado)
1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras Plataformas
- **Heroku**: Compatível
- **Vercel**: Compatível
- **DigitalOcean**: Compatível

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Consulte a documentação em `TESTE_MODO_MEMORIA.md`
3. Teste os atalhos F9/F10 no telão

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para tornar eventos mais especiais!**
