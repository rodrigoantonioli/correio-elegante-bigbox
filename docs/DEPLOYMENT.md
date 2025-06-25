# 🚀 Deployment Guide

## 📋 Pré-requisitos

- Node.js 14+ instalado
- NPM ou Yarn
- Acesso a um servidor ou plataforma de cloud
- Domínio (opcional, mas recomendado)

## 🔧 Configuração Local

### 1. Instalação
```bash
git clone https://github.com/rodrigoantonioli/correio-elegante-bigbox.git
cd correio-elegante-bigbox
npm install
```

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```bash
# === Configurações Obrigatórias ===
ADMIN_PASSWORD=sua_senha_super_secreta
SESSION_SECRET=uma_frase_bem_longa_e_aleatoria_para_seguranca

# === Configurações Opcionais ===
PORT=3000
NODE_ENV=production

# === Log em Nuvem (Opcional) ===
GITHUB_TOKEN=seu_token_do_github
GIST_ID=id_do_seu_gist
GIST_FILENAME=log_evento.log
```

### 3. Configuração de Mensagens
Edite `messages.json` para personalizar as mensagens do seu evento:

```json
{
  "categories": ["Geral", "Romântico", "Amizade", "Família"],
  "messages": [
    {
      "text": "Sua beleza é como um bug no meu coração!",
      "category": "Romântico"
    },
    {
      "text": "Você é incrível!",
      "category": "Amizade"
    }
  ]
}
```

### 4. Logo Personalizado
Substitua `public/images/logo.png` pelo logo do seu evento.

## ☁️ Deploy em Produção

### Render.com (Recomendado)

1. **Criar conta** no [Render.com](https://render.com)

2. **Conectar repositório**:
   - Clique em "New Web Service"
   - Conecte seu repositório GitHub
   - Selecione o repositório do Correio Elegante

3. **Configurar o serviço**:
   - **Name**: `correio-elegante`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (ou pago para mais recursos)

4. **Variáveis de Ambiente**:
   - Vá em "Environment"
   - Adicione todas as variáveis do seu `.env`
   - **IMPORTANTE**: Configure `ADMIN_PASSWORD` e `SESSION_SECRET`

5. **Deploy**:
   - Clique em "Create Web Service"
   - Aguarde o deploy (2-5 minutos)
   - Seu app estará disponível em `https://seu-app.onrender.com`

### Heroku

1. **Instalar Heroku CLI**:
```bash
npm install -g heroku
```

2. **Login e criar app**:
```bash
heroku login
heroku create seu-correio-elegante
```

3. **Configurar variáveis**:
```bash
heroku config:set ADMIN_PASSWORD=sua_senha
heroku config:set SESSION_SECRET=sua_chave_secreta
```

4. **Deploy**:
```bash
git push heroku main
```

### Vercel

1. **Conectar repositório** no [Vercel.com](https://vercel.com)

2. **Configurar build**:
   - Framework Preset: `Node.js`
   - Build Command: `npm install`
   - Output Directory: `.`
   - Install Command: `npm install`

3. **Variáveis de ambiente** no painel do Vercel

4. **Deploy automático** a cada push

### DigitalOcean App Platform

1. **Criar app** no DigitalOcean

2. **Conectar repositório** GitHub

3. **Configurar**:
   - Source: GitHub
   - Branch: `main`
   - Build Command: `npm install`
   - Run Command: `npm start`

4. **Variáveis de ambiente** no painel

## 🔒 Segurança em Produção

### Senhas Fortes
```bash
# Gerar senha forte
openssl rand -base64 32

# Gerar chave de sessão
openssl rand -base64 64
```

### HTTPS
- Render, Heroku e Vercel fornecem HTTPS automaticamente
- Para outros servidores, configure SSL/TLS

### Firewall
- Configure firewall para permitir apenas porta 80/443
- Bloqueie acesso direto à porta 3000

### Logs
- Configure logs remotos via GitHub Gist
- Monitore logs regularmente
- Configure alertas para erros

## 📊 Monitoramento

### Métricas Importantes
- **Uptime**: Disponibilidade do serviço
- **Response Time**: Tempo de resposta
- **Memory Usage**: Uso de memória
- **CPU Usage**: Uso de processador
- **Active Connections**: Conexões ativas

### Alertas
- Configure alertas para:
  - Servidor offline
  - Alto uso de recursos
  - Erros frequentes
  - Muitas mensagens de erro

## 🔄 Manutenção

### Atualizações
```bash
# Atualizar código
git pull origin main
npm install
npm start

# Ou reiniciar serviço
heroku restart  # Heroku
# Render: automático
```

### Backup
- Configure backup automático dos logs
- Backup do arquivo `messages.json`
- Backup das variáveis de ambiente

### Logs
- Monitore `message_history.log`
- Verifique logs do servidor
- Configure rotação de logs

## 🚨 Troubleshooting

### Problemas Comuns

#### App não inicia
```bash
# Verificar logs
heroku logs --tail  # Heroku
# Render: Logs no painel

# Verificar variáveis
heroku config  # Heroku
```

#### Erro de conexão
- Verificar se a porta está correta
- Verificar firewall
- Verificar variáveis de ambiente

#### Performance lenta
- Verificar uso de recursos
- Otimizar imagens
- Considerar upgrade do plano

### Comandos Úteis
```bash
# Verificar status
npm run start

# Testar localmente
npm start

# Verificar dependências
npm audit

# Limpar cache
npm cache clean --force
```

## 📞 Suporte

### Logs de Erro
- Verifique logs do servidor
- Verifique logs do navegador (F12)
- Verifique logs do Socket.IO

### Recursos
- [Documentação Socket.IO](https://socket.io/docs/)
- [Documentação Express](https://expressjs.com/)
- [Render Documentation](https://render.com/docs)
- [Heroku Documentation](https://devcenter.heroku.com/)

---

**Dica**: Sempre teste localmente antes de fazer deploy em produção! 🧪 