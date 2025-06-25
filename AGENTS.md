# AGENTS instructions

## Visão geral
Este repositório contém a aplicação "Correio Elegante BigBox" em Node.js. O servidor Express está em `server.js` e o frontend está na pasta `public`. Arquivos de administração ficam em `private/`.

## Estrutura
- `server.js` – servidor Express e lógica principal.
- `remoteLogger.js` – envio de logs para um Gist.
- `messages.json` – categorias e mensagens pré-definidas.
- `public/` e `private/` – arquivos HTML, CSS e JS.
- `test/` – testes em Jest.

## Configuração rápida
1. Instale dependências com `npm install`.
2. Crie um `.env` na raiz com pelo menos:
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   Variáveis opcionais: `GITHUB_TOKEN`, `GIST_ID`, `GIST_FILENAME` para log em nuvem.
3. Inicie com `npm start` ou `nodemon server.js`.
4. Acesse:
   - `http://localhost:3000` para envio de mensagens
   - `http://localhost:3000/display` para o telão
   - `http://localhost:3000/login` para login do admin

Trechos sobre a configuração estão no README, linhas 55–90.

## Testes
Execute `npm test` para rodar os testes (Jest e Supertest) localizados em `test/server.test.js`.

## Estilo de código
- JavaScript usa indentção de 4 espaços e ponto e vírgula.
- Strings utilizam aspas simples.
- Mantenha a organização existente das pastas.

## Dicas adicionais
- O arquivo `message_history.log` é criado na raiz quando o servidor roda.
- Os logs podem ser enviados a um Gist se as variáveis de ambiente forem definidas.
- Evite versionar `.env` ou `message_history.log`.

Esta aplicação é licenciada sob MIT.
