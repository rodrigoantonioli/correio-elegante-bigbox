# 🤝 Contribuindo para o Correio Elegante

## 📋 Como Contribuir

Obrigado por considerar contribuir para o Correio Elegante! Este guia irá ajudá-lo a começar.

## 🚀 Primeiros Passos

### 1. Fork e Clone
```bash
# Faça um fork do repositório
# Clone seu fork
git clone https://github.com/seu-usuario/correio-elegante-bigbox.git
cd correio-elegante-bigbox

# Adicione o repositório original como upstream
git remote add upstream https://github.com/rodrigoantonioli/correio-elegante-bigbox.git
```

### 2. Instalação
```bash
npm install
```

### 3. Configuração
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Configure as variáveis de ambiente
# Edite .env com suas configurações
```

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
CorreioElegante/
├── public/                 # Frontend (HTML, CSS, JS)
│   ├── css/               # Estilos
│   ├── js/                # JavaScript do cliente
│   ├── images/            # Imagens
│   ├── audio/             # Sons
│   ├── index.html         # Página principal
│   ├── display.html       # Telão
│   └── login.html         # Login admin
├── private/               # Páginas administrativas
├── docs/                  # Documentação
├── test/                  # Testes
├── server.js              # Servidor principal
├── messages.json          # Configuração de mensagens
└── package.json           # Dependências
```

### Scripts Disponíveis
```bash
npm start          # Inicia o servidor
npm test           # Executa os testes
npm run dev        # Modo desenvolvimento (se configurado)
```

### Padrões de Código

#### JavaScript
- Use **ES6+** quando possível
- **Indentação**: 4 espaços
- **Strings**: Aspas simples (`'`)
- **Semicolons**: Sim
- **Comentários**: JSDoc para funções complexas

#### CSS
- **Indentação**: 4 espaços
- **Seletores**: kebab-case
- **Propriedades**: Ordem alfabética
- **Comentários**: Para seções importantes

#### HTML
- **Indentação**: 4 espaços
- **Atributos**: Ordem lógica
- **Comentários**: Para seções complexas

### Exemplo de Código
```javascript
/**
 * Cria um card de mensagem com animações
 * @param {Object} msg - Objeto da mensagem
 * @returns {HTMLElement} Elemento do card
 */
const createHistoryCard = (msg) => {
    const card = document.createElement('div');
    card.className = 'history-message-card';
    
    // Lógica do card...
    
    return card;
};
```

## 🧪 Testes

### Executando Testes
```bash
npm test
```

### Escrevendo Testes
- Use **Jest** como framework
- Teste funções isoladamente
- Cubra casos de borda
- Mantenha testes simples e legíveis

### Exemplo de Teste
```javascript
describe('createHistoryCard', () => {
    test('should create card with correct structure', () => {
        const msg = {
            recipient: 'João',
            message: 'Teste',
            sender: 'Maria',
            timestamp: new Date()
        };
        
        const card = createHistoryCard(msg);
        
        expect(card.className).toBe('history-message-card');
        expect(card.querySelector('.recipient')).toBeTruthy();
    });
});
```

## 📝 Trabalhando em Issues

### 1. Escolha uma Issue
- Verifique issues com label `good first issue`
- Comente na issue que você vai trabalhar nela
- Peça esclarecimentos se necessário

### 2. Crie uma Branch
```bash
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-fix
```

### 3. Desenvolva
- Faça commits pequenos e frequentes
- Use mensagens de commit descritivas
- Teste suas mudanças

### 4. Commit Messages
```bash
# Formato: tipo(escopo): descrição

feat(display): adiciona animações ao modo memória
fix(server): corrige erro de conexão Socket.IO
docs(readme): atualiza instruções de instalação
style(css): melhora responsividade do telão
test(api): adiciona testes para eventos Socket.IO
```

### 5. Push e Pull Request
```bash
git push origin feature/nome-da-feature
```

## 🔄 Pull Request

### Checklist do PR
- [ ] Código segue os padrões do projeto
- [ ] Testes passam
- [ ] Documentação atualizada (se necessário)
- [ ] Mudanças testadas localmente
- [ ] Commit messages descritivas
- [ ] PR tem descrição clara

### Template do PR
```markdown
## 📋 Descrição
Breve descrição das mudanças

## 🎯 Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## 🧪 Como Testar
1. Passo 1
2. Passo 2
3. Passo 3

## 📸 Screenshots (se aplicável)

## ✅ Checklist
- [ ] Código testado
- [ ] Documentação atualizada
- [ ] Testes passam
```

## 🐛 Reportando Bugs

### Template de Bug Report
```markdown
## 🐛 Descrição do Bug
Descrição clara e concisa do bug

## 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## ✅ Comportamento Esperado
O que deveria acontecer

## 📱 Informações do Sistema
- OS: [ex: Windows 10]
- Browser: [ex: Chrome 91]
- Versão: [ex: 2.0.0]

## 📸 Screenshots
Se aplicável, adicione screenshots

## 📋 Contexto Adicional
Qualquer outra informação relevante
```

## 💡 Sugerindo Features

### Template de Feature Request
```markdown
## 💡 Descrição da Feature
Descrição clara da funcionalidade desejada

## 🎯 Problema que Resolve
Por que essa feature é necessária?

## 💭 Solução Proposta
Como você imagina que deveria funcionar?

## 🔄 Alternativas Consideradas
Outras soluções que você considerou

## 📋 Contexto Adicional
Qualquer informação adicional
```

## 📚 Recursos

### Documentação
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [README Principal](../README.md)

### Tecnologias
- [Socket.IO](https://socket.io/docs/)
- [Express.js](https://expressjs.com/)
- [Node.js](https://nodejs.org/docs/)

### Ferramentas
- [Git](https://git-scm.com/doc)
- [GitHub](https://docs.github.com/)
- [Jest](https://jestjs.io/docs/getting-started)

## 🏷️ Labels

### Tipos de Issue
- `bug` - Bug report
- `enhancement` - Feature request
- `documentation` - Melhorias na documentação
- `good first issue` - Bom para iniciantes

### Prioridades
- `high` - Alta prioridade
- `medium` - Prioridade média
- `low` - Baixa prioridade

### Status
- `help wanted` - Precisa de ajuda
- `wontfix` - Não será corrigido
- `duplicate` - Issue duplicada

## 🤝 Comunidade

### Código de Conduta
- Seja respeitoso e inclusivo
- Ajude outros desenvolvedores
- Mantenha discussões construtivas
- Reporte comportamentos inadequados

### Comunicação
- **Issues**: Para bugs e features
- **Discussions**: Para perguntas e ideias
- **Pull Requests**: Para código

---

**Obrigado por contribuir!** 🎉 