# 💌 Correio Elegante BigBox - Versão 2.0 "Big 2"

Um sistema completo e moderno de Correio Elegante, perfeito para festas juninas, casamentos, eventos corporativos e confraternizações. Permite que os convidados enviem mensagens através de seus celulares para serem exibidas em um telão em tempo real.

Esta versão foi aprimorada com foco em auditoria, estabilidade e uma experiência visual mais elegante.

![Telão](docs/images/tela-principal.png)

## ✨ Funcionalidades Principais

### Para os Convidados
- **Envio Simples por QR Code:** Aponte a câmera do celular para o telão e envie sua mensagem.
- **Mensagens Prontas e Personalizadas:** Escolha entre categorias e mensagens clássicas ou escreva a sua própria.
- **Anonimato Garantido:** O padrão é "Admirador Secreto", mas o remetente pode se identificar se quiser.

### Para o Telão
- **Exibição Elegante:** Mensagens exibidas em um layout de cartão, com aspas decorativas animadas.
- **Fila Inteligente:** O tempo de exibição é ajustado automaticamente para garantir que todas as mensagens sejam lidas.
- **Modo de Espera Interativo:** Quando ocioso, exibe um QR Code grande e um contador de mensagens para incentivar a participação.
- **Modo de Memórias:** Quando o telão está ocioso por mais tempo, as mensagens já exibidas sobem pela tela, mantendo o ambiente interativo.
- **Notificações Visuais e Sonoras:** Um contador e um som de notificação alertam sobre novas mensagens na fila.

### Para o Administrador
- **Painel de Controle Seguro:** Acesso protegido por senha a uma área de gerenciamento completa.
- **Gerenciador de Mensagens e Categorias:** Adicione, edite ou remova as mensagens pré-definidas e suas categorias.
- **Monitor de Clientes:** Acompanhe em tempo real quantos clientes estão conectados e de quais páginas. Bloqueie IPs, se necessário.
- **Histórico Completo:** Acesse e baixe um log de todas as mensagens enviadas durante o evento.
- **Estatísticas do Evento:** Veja dados como o total de mensagens, os homenageados mais populares e as páginas mais acessadas.

## 🚀 Tecnologias Utilizadas
- **Backend:** Node.js, Express.js
- **Comunicação Real-time:** Socket.IO
- **Frontend:** HTML5, CSS3, JavaScript (puro, sem frameworks)
- **Segurança:** `helmet` e `cookie-session` para proteção e gerenciamento de sessão.
- **Logging e Auditoria:** Log local e integração com **GitHub Gist** para persistência em nuvem.

---

## 🏁 Como Rodar o Projeto

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- `npm` (instalado com o Node.js)
- `git`

### 2. Instalação
Clone o repositório e instale as dependências:
```bash
git clone https://github.com/rodrigoantonioli/correio-elegante-bigbox.git
cd correio-elegante-bigbox
npm install
```

### 3. Configuração (Variáveis de Ambiente)
Crie um arquivo chamado `.env` na raiz do projeto e adicione as seguintes variáveis:

```dotenv
# === Configurações Obrigatórias ===
# Senha para o painel /admin
ADMIN_PASSWORD=sua_senha_secreta

# Chave para a segurança da sessão de login (use uma frase longa e aleatória)
SESSION_SECRET=uma_frase_bem_longa_e_aleatoria_para_seguranca

# === Configurações Opcionais para Log em Nuvem (GitHub Gist) ===
# Ideal para ambientes como o Render, que não persistem arquivos.

# Token de acesso pessoal do GitHub com permissão para 'gist'
# Tutorial para criar token: https://docs.github.com/pt/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
GITHUB_TOKEN=seu_token_do_github

# ID do Gist que será usado para armazenar o log.
# Crie um Gist secreto e pegue o ID da URL. Ex: https://gist.github.com/user/ID_DO_GIST
GIST_ID=id_do_seu_gist

# Nome do arquivo dentro do Gist (opcional, o padrão é message_history.log)
GIST_FILENAME=log_festa_junina.log
```
> **Atenção:** Em produção (Render, Heroku, etc.), configure essas variáveis diretamente no painel de controle do serviço.

### 4. Iniciando o Servidor
```bash
npm start
```
Ou, para desenvolvimento com reinício automático (requer `nodemon`):
```bash
npm install -g nodemon
nodemon server.js
```

### 5. Acessando as Páginas
- **Envio de Mensagens:** `http://localhost:3000`
- **Telão:** `http://localhost:3000/display`
- **Login do Admin:** `http://localhost:3000/login`

---

## ☁️ Deploy em Produção (Render)

1. **Faça o upload do seu projeto para o GitHub.**
2. **No [Render](https://render.com/), crie um novo "Web Service".**
3. **Conecte seu repositório do GitHub.**
4. **Configure o serviço:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Adicione as Variáveis de Ambiente:** No painel do Render, vá em "Environment" e adicione todas as variáveis do seu arquivo `.env`. **Esta etapa é crucial para a segurança e funcionalidade do sistema.**
6. **Inicie o deploy.** Seu projeto estará no ar em minutos!

---

## 📜 Sistema de Log e Auditoria

- **Log Local:** O arquivo `message_history.log` é gerado na raiz do projeto, mas não é persistido em serviços como o Render.
- **Log em Nuvem:** Ao configurar as variáveis de ambiente do GitHub Gist, o sistema envia as mensagens em lotes (a cada 10 mensagens ou 60 segundos), garantindo um backup seguro e persistente para auditoria. O Gist também registrará cada vez que o servidor for iniciado ou desligado.
- **Buffer Inteligente:** O sistema acumula logs em memória para evitar sobrecarregar a API do GitHub, enviando-os de forma eficiente.
