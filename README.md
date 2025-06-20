# 💌 Correio Elegante em Tempo Real para Festas

Projeto completo de um sistema de Correio Elegante para festas e eventos, com envio de mensagens por celular, exibição em telão com voz, e painel de administração seguro. Ideal para festas juninas, casamentos e confraternizações.


## ✨ Funcionalidades Principais

- **Envio Anônimo:** Convidados enviam mensagens de seus celulares, com "Admirador Secreto" como padrão.
- **Telão Inteligente:** Exibe mensagens em fila, com leitura em voz alta (Web Speech API).
  - O tempo de exibição é ajustado automaticamente (60s para a última mensagem, 20s se houver fila).
  - A fila é interrompida de forma inteligente para exibir novas mensagens mais rápido.
- **Notificações em Tempo Real:** O telão exibe um contador de mensagens na fila e toca um som de notificação a cada novo envio.
- **Painel de Administração Seguro:**
  - Protegido por senha.
  - Permite configurar a lista de mensagens prontas.
  - Exibe um log em tempo real das mensagens enviadas na festa.
- **Auditoria Completa:** Uma página de histórico separada (`/history`) registra todas as mensagens enviadas, incluindo o endereço IP do remetente.
- **Layout Personalizado:** Design temático com o logo da empresa/evento.

## 🚀 Tecnologias Utilizadas

- **Backend:** Node.js, Express.js
- **Comunicação Real-time:** Socket.IO
- **Autenticação:** `cookie-session` para sessões de administrador.
- **Segurança:** `helmet` para configurar cabeçalhos HTTP padrão.
- **Frontend:** HTML5, CSS3, JavaScript (puro)
- **Geração de QR Code:** `qrcode` (via CDN)
- **Versionamento:** Git & GitHub

---

## 🏁 Como Rodar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- `npm` (instalado com o Node.js)
- Definir as variáveis `ADMIN_PASSWORD` e `SESSION_SECRET` antes de iniciar

### Passos
1. **Clone o repositório:**
   ```bash
   git clone https://github.com/rodrigoantonioli/correio-elegante-bigbox.git
   cd correio-elegante-bigbox
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Defina as variáveis de ambiente obrigatórias:**
   ```bash
   export ADMIN_PASSWORD=sua_senha
   export SESSION_SECRET=uma_frase_secreta
   ```
4. **Inicie o servidor:**
   ```bash
   npm start
   ```
5. **Acesse as páginas no seu navegador:**
   - **Envio de Mensagens:** `http://localhost:3000`
   - **Telão:** `http://localhost:3000/display`
   - **Administração:** `http://localhost:3000/admin` (será redirecionado para o login)

---

## ☁️ Como Publicar na Internet (Deploy no Render)

Para que todos na festa possam acessar, o ideal é publicar o projeto na internet. O serviço gratuito do Render é perfeito para isso.

1. **Envie o projeto para o GitHub:** Siga os passos de versionamento com `git`.

2. **Crie uma conta no [Render](https://render.com):** Use sua conta do GitHub para facilitar.

3. **Crie um "New Web Service":**
   - Conecte seu repositório do GitHub.
   - Configure da seguinte forma:
     - **Name:** `correio-elegante-bigbox` (ou o nome que preferir).
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Instance Type:** `Free`

4. **Configure as Variáveis de Ambiente (MUITO IMPORTANTE):**
   - Na seção "Environment", adicione as seguintes variáveis:
     - **`ADMIN_PASSWORD`**: Defina a senha que você desejar para a área de admin.
     - **`SESSION_SECRET`**: Crie uma frase longa e aleatória para a segurança da sessão.

5. **Clique em "Create Web Service".** Após alguns minutos, seu projeto estará no ar em um link como `https://correio-elegante-bigbox.onrender.com`.

## 🎉 Como Usar na Festa

1. **Acesse o link do telão no projetor:** `https://SEU_LINK.onrender.com/display`
2. **Coloque em tela cheia (F11)** e clique em "Iniciar Telão".
3. O QR Code que aparecerá na tela já estará apontando para o seu site. Basta os convidados escanearem para começar a enviar as mensagens!

## 📜 Retenção de Mensagens

O servidor guarda em memória apenas as últimas **100** mensagens (ou o valor definido na variável de ambiente `MAX_LOG_SIZE`).
O histórico completo é salvo continuamente no arquivo `message_history.log` e pode ser acessado na página `/history`.
