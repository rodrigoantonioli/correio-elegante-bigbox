# Correio Elegante em Tempo Real

Este é um projeto de um sistema de Correio Elegante para festas e eventos. Os convidados podem escanear um QR Code, acessar uma página para enviar uma mensagem pré-definida e ela aparecerá em um telão em tempo real, com leitura em voz alta.

## Funcionalidades

- **Página de Envio:** Formulário para o convidado preencher o destinatário, escolher uma mensagem e assinar.
- **Telão:** Exibe as mensagens recebidas em fila, uma por vez.
- **Leitura em Voz Alta:** Utiliza a Web Speech API do navegador para ler a mensagem no telão.
- **Fila de Mensagens:** As mensagens são enfileiradas no servidor e exibidas na ordem de chegada.
- **QR Code Dinâmico:** O telão exibe um QR Code que leva diretamente para a página de envio.
- **Painel de Administração:** Uma página para visualizar o log de mensagens enviadas e para configurar (adicionar, editar, remover) a lista de mensagens prontas.
- **Comunicação em Tempo Real:** Utiliza `Socket.IO` para garantir que as mensagens apareçam instantaneamente.

## Tecnologias Utilizadas

- **Backend:** Node.js, Express.js
- **Comunicação Real-time:** Socket.IO
- **Frontend:** HTML5, CSS3, JavaScript (puro)
- **Geração de QR Code:** `qrcode` (via CDN)
- **Síntese de Voz:** Web Speech API (nativa do navegador)

## Estrutura do Projeto

```
/
├── public/
│   ├── index.html         # Página para enviar mensagens
│   ├── display.html       # Página para o telão
│   ├── admin.html         # Página de administração
│   └── css/
│       └── style.css
│   └── js/
│       ├── main.js        # Lógica do formulário de envio
│       ├── display.js     # Lógica do telão
│       └── admin.js       # Lógica do painel admin
├── server.js              # Servidor (Express + Socket.IO)
├── messages.json          # Arquivo com as mensagens prontas
├── package.json
└── README.md
```

## Como Rodar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- `npm` (geralmente instalado com o Node.js)

### Passos

1.  **Clone o repositório ou baixe os arquivos para uma pasta no seu computador.**

2.  **Abra o terminal na pasta do projeto e instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o servidor:**
    ```bash
    npm start
    ```

4.  **Acesse as páginas no seu navegador:**
    -   **Para enviar uma mensagem:** [http://localhost:3000](http://localhost:3000)
    -   **Para ver o telão:** [http://localhost:3000/display.html](http://localhost:3000/display.html)
    -   **Para administrar:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

### Como usar na festa

1.  Conecte um computador à internet e ao telão/projetor da festa.
2.  Rode o projeto neste computador.
3.  Abra um navegador no modo de tela cheia e acesse a página do telão (`http://IP_DO_COMPUTADOR:3000/display.html`).
4.  O telão mostrará o QR Code. Os convidados podem escaneá-lo com seus celulares para acessar a página de envio e começar a diversão! 