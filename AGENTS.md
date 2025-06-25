# 🤖 AGENTS Instructions - Correio Elegante

## 📋 Visão Geral

Este repositório contém a aplicação **"Correio Elegante BigBox"** - um sistema completo de correio elegante para eventos, desenvolvido em Node.js com Socket.IO para comunicação em tempo real.

### 🎯 Propósito
Sistema para permitir que convidados enviem mensagens através de seus celulares para serem exibidas em um telão em tempo real, com painel administrativo completo.

## 🏗️ Arquitetura

### Backend
- **`server.js`** – Servidor Express principal com Socket.IO
- **`remoteLogger.js`** – Sistema de logs remotos via GitHub Gist
- **`messages.json`** – Configuração de categorias e mensagens pré-definidas

### Frontend
- **`public/`** – Arquivos públicos (HTML, CSS, JS)
  - `index.html` – Página de envio de mensagens
  - `display.html` – Telão de exibição
  - `login.html` – Login administrativo
- **`private/`** – Páginas administrativas protegidas

### Testes
- **`test/`** – Testes automatizados (Jest + Supertest)

## ⚡ Configuração Rápida

### 1. Instalação
```bash
git clone https://github.com/rodrigoantonioli/correio-elegante-bigbox.git
cd correio-elegante-bigbox
npm install
```

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz:

```bash
# === OBRIGATÓRIAS ===
ADMIN_PASSWORD=sua_senha_super_secreta
SESSION_SECRET=uma_frase_bem_longa_e_aleatoria_para_seguranca

# === OPCIONAIS ===
PORT=3000
NODE_ENV=development

# === LOG EM NUVEM (OPCIONAL) ===
GITHUB_TOKEN=seu_token_do_github
GIST_ID=id_do_seu_gist
GIST_FILENAME=log_evento.log
```

### 3. Execução
```bash
npm start
# ou para desenvolvimento
nodemon server.js
```

### 4. Acesso
- **Envio de Mensagens**: `http://localhost:3000`
- **Telão**: `http://localhost:3000/display`
- **Login Admin**: `http://localhost:3000/login`
- **Painel Admin**: `http://localhost:3000/admin` (após login)

## 🧪 Testes

### Execução
```bash
npm test
```

### Cobertura
- **`test/server.test.js`** – Testes do servidor Express
- **`test/concurrency.test.js`** – Testes de concorrência
- **Jest + Supertest** para testes de integração

## 📝 Padrões de Código

### JavaScript
- **Indentação**: 4 espaços
- **Strings**: Aspas simples (`'`)
- **Semicolons**: Obrigatórios
- **ES6+**: Use quando possível
- **Comentários**: JSDoc para funções complexas

### CSS
- **Indentação**: 4 espaços
- **Seletores**: kebab-case
- **Organização**: Por seções lógicas
- **Comentários**: Para seções importantes

### HTML
- **Indentação**: 4 espaços
- **Atributos**: Ordem lógica
- **Semântica**: Use tags apropriadas

## 🔧 Funcionalidades Principais

### Para Convidados
- Envio de mensagens via QR Code
- Mensagens pré-definidas por categoria
- Anonimato opcional
- Interface responsiva

### Para o Telão
- Exibição automática de mensagens
- Modo de espera com QR Code
- Modo memória com animações
- Controles manuais (F9/F10)

### Para Administradores
- Painel de controle protegido
- Monitoramento de clientes
- Estatísticas em tempo real
- Gerenciamento de mensagens
- Histórico completo

## 📊 Monitoramento

### Logs
- **Local**: `message_history.log` (criado automaticamente)
- **Remoto**: GitHub Gist (se configurado)
- **Console**: Logs detalhados em tempo real

### Métricas
- Total de mensagens enviadas
- Clientes conectados
- Mensagens na fila
- Performance do sistema

## 🛡️ Segurança

### Autenticação
- Sessões baseadas em cookies
- Senha única para área administrativa
- Bloqueio de IPs maliciosos

### Validação
- Sanitização de entrada
- Limitação de tamanho
- Rate limiting implícito

## 🚀 Deploy

### Plataformas Suportadas
- **Render.com** (recomendado)
- **Heroku**
- **Vercel**
- **DigitalOcean**

### Configuração de Produção
- Configure variáveis de ambiente
- Use HTTPS
- Configure logs remotos
- Monitore performance

## 📚 Documentação

### Arquivos de Documentação
- **`README.md`** – Visão geral e instruções
- **`docs/API.md`** – Documentação da API
- **`docs/DEPLOYMENT.md`** – Guia de deploy
- **`docs/CONTRIBUTING.md`** – Guia de contribuição

### Recursos Externos
- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

## 🔄 Fluxo de Desenvolvimento

### 1. Setup
```bash
git clone [repo]
npm install
cp .env.example .env
# Configure .env
```

### 2. Desenvolvimento
```bash
npm start
# ou
nodemon server.js
```

### 3. Testes
```bash
npm test
```

### 4. Commit
```bash
git add .
git commit -m "tipo(escopo): descrição"
git push
```

## ⚠️ Pontos Importantes

### Arquivos Sensíveis
- **NÃO versionar**: `.env`, `message_history.log`
- **Versionar**: `messages.json` (configuração)

### Performance
- Socket.IO otimizado para eventos
- Logs em lotes para evitar sobrecarga
- Cache de configurações

### Compatibilidade
- Navegadores modernos (ES6+)
- Mobile responsivo
- Socket.IO fallbacks

## 🆘 Troubleshooting

### Problemas Comuns
1. **Porta em uso**: Mude `PORT` no `.env`
2. **Erro de conexão**: Verifique variáveis de ambiente
3. **Logs não aparecem**: Verifique permissões de arquivo
4. **Socket.IO não conecta**: Verifique firewall/proxy

### Comandos Úteis
```bash
# Verificar status
npm run start

# Limpar cache
npm cache clean --force

# Verificar dependências
npm audit

# Logs em tempo real
tail -f message_history.log
```

---

**Licença**: MIT  
**Versão**: 2.0  
**Status**: ✅ Pronto para Produção
