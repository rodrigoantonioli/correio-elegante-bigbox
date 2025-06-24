# 💌 Correio Elegante em Tempo Real para Festas

Um sistema completo e moderno de Correio Elegante, perfeito para festas juninas, casamentos, eventos corporativos e confraternizações. Permite que os convidados enviem mensagens através de seus celulares para serem exibidas em um telão em tempo real.

O projeto foi desenhado para ser robusto, seguro e fácil de usar, tanto para os convidados quanto para o administrador do evento.

## ✨ Funcionalidades Principais

### Para os Convidados
- **Envio Simples por QR Code:** Aponte a câmera do celular para o telão e envie sua mensagem.
- **Mensagens Prontas e Personalizadas:** Escolha entre mensagens clássicas ou escreva a sua própria.
- **Anonimato Garantido:** O padrão é "Admirador Secreto", mas o remetente pode se identificar se quiser.

### Para o Telão
- **Exibição em Tempo Real:** As mensagens aparecem na fila assim que são enviadas.
- **Leitura em Voz Alta:** O telão usa a Web Speech API para ler as mensagens, criando um momento de destaque.
- **Fila Inteligente:** O tempo de exibição é ajustado automaticamente para garantir que todas as mensagens sejam lidas.
- **Modo de Memórias:** Quando o telão está ocioso, as mensagens mais antigas sobem pela tela, mantendo o ambiente interativo.
- **Notificações Visuais e Sonoras:** Um contador e um som de notificação alertam sobre novas mensagens na fila.

### Para o Administrador
- **Painel de Controle Seguro:** Acesso protegido por senha a uma área de gerenciamento completa.
- **Gerenciador de Mensagens:** Adicione, edite ou remova as mensagens pré-definidas.
- **Monitor de Clientes:** Acompanhe em tempo real quantos clientes estão conectados e de quais páginas. Bloqueie IPs, se necessário.
- **Histórico Completo:** Acesse e baixe um log de todas as mensagens enviadas durante o evento.
- **Estatísticas do Evento:** Veja dados como o total de mensagens, os homenageados mais populares e as páginas mais acessadas.

## 🚀 Tecnologias Utilizadas

- **Backend:** Node.js, Express.js
- **Comunicação Real-time:** Socket.IO
- **Frontend:** HTML5, CSS3, JavaScript (puro, sem frameworks)
- **Autenticação:** `cookie-session` para sessões de administrador.
- **Segurança:** `helmet` para proteção contra vulnerabilidades web comuns (XSS, etc.).
- **Geração de QR Code:** `qrcode`

---

## 🏁 Como Rodar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- `npm` (instalado com o Node.js)

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

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto ou defina as variáveis diretamente no seu terminal.
   
   **Exemplo de arquivo `.env**:**
   ```
   # Senha para o painel /admin
   ADMIN_PASSWORD=sua_senha_secreta

   # Chave para a segurança da sessão de login
   SESSION_SECRET=uma_frase_bem_longa_e_aleatoria_para_seguranca

   # (Opcional) Configurações para salvar o log no Amazon S3
   S3_BUCKET=nome-do-seu-bucket
   AWS_REGION=sua-regiao
   AWS_ACCESS_KEY_ID=sua_chave
   AWS_SECRET_ACCESS_KEY=sua_chave_secreta
   ```
   > **Atenção:** Em produção, use sempre senhas e chaves fortes.

4. **Inicie o servidor:**
   ```bash
   node server.js
   ```

5. **Acesse as páginas no seu navegador:**
   - **Envio de Mensagens:** `http://localhost:3000`
   - **Telão:** `http://localhost:3000/display`
   - **Login do Admin:** `http://localhost:3000/login`

---

## 📁 Estrutura do Projeto

```
/
├── private/            # Arquivos do painel de admin (protegidos por senha)
├── public/             # Arquivos públicos (CSS, JS, imagens, páginas de envio e telão)
├── messages.json       # Armazena as mensagens pré-definidas
├── message_history.log # Log completo de todas as mensagens enviadas
├── server.js           # O coração da aplicação: servidor Express e lógica Socket.IO
└── package.json        # Dependências e scripts do projeto
```

## ☁️ Como Publicar na Internet (Deploy)

Para que todos na festa possam acessar, o ideal é publicar o projeto na internet. Serviços como **Render** ou **Heroku** são excelentes opções.

**Passos Essenciais para o Deploy:**
1. **Faça o upload do seu projeto para um repositório Git (GitHub, GitLab).**
2. **No serviço de hospedagem escolhido, crie um novo "Web Service".**
3. **Conecte seu repositório.**
4. **Configure os comandos:**
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. **Configure as Variáveis de Ambiente (MUITO IMPORTANTE):**
   - No painel do serviço de hospedagem, adicione as mesmas variáveis `ADMIN_PASSWORD` e `SESSION_SECRET` que você usou localmente.
6. **Inicie o deploy.** Após alguns minutos, seu projeto estará no ar!

## 🎉 Como Usar na Festa

1. **Acesse o link do telão no projetor:** `https://SEU_LINK_PUBLICADO/display`
2. **Coloque em tela cheia (F11)** e clique em "Iniciar Telão".
3. O QR Code que aparecerá na tela de espera ou no modo de memórias já apontará para o seu site. Basta os convidados escanearem para começar a diversão!

## 📜 Retenção de Mensagens

O servidor guarda em memória apenas as últimas **100** mensagens (ou o valor definido na variável de ambiente `MAX_LOG_SIZE`).
O histórico completo é salvo continuamente no arquivo `message_history.log` e pode ser acessado na página `/history`.
Se você definir `S3_BUCKET`, esse arquivo também será sincronizado com o Amazon S3, garantindo a persistência mesmo após reinícios do servidor.
