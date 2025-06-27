# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.2.1] - 2025-06-27 - HOTFIX

### 🐛 Correção Crítica
- **Bug de sincronização entre estados**: Corrigido problema onde mensagens eram narradas mas não exibidas
  - Adiciona delay de 500ms antes de entrar em modo de espera
  - Cancela síntese de voz anterior ao receber nova mensagem
  - Impede entrada em modo de espera durante processamento
  - Sempre muda para tela correta antes de processar

## [1.2.0] - 2025-06-27

### 🎉 Novo
- **Suporte para múltiplos telões sincronizados**: Agora todos os telões mostram a mesma mensagem simultaneamente
- **Narração por voz automática**: Cada mensagem é lida em voz alta usando síntese de voz em português
- **Indicador visual de atalhos**: Mostra discretamente os comandos F9/F10 no telão

### 🐛 Correções
- **Mensagens cortadas no modo memória**: Removido overflow:hidden e adicionado quebra de palavra automática
- **Sincronização entre telões**: Implementado contador para garantir que todos os displays terminem antes de avançar
- **Tamanhos de fonte otimizados**: Ajustados proporcionalmente para melhor legibilidade
- **Velocidade de animação**: Aumentada para 60s/75s para dar mais tempo de leitura

### 🔧 Melhorias
- **Performance para eventos grandes**: Testado e otimizado para 200+ pessoas
- **Controle de ID de mensagem**: Previne processamento duplicado
- **Documentação atualizada**: Incluídas dicas para eventos de grande porte

## [1.1.0] - 2025-06-26

### 🎉 Novo
- **Modo Memória animado**: Exibição automática do histórico com animações coloridas
- **Atalhos de teclado**: F9 para modo memória, F10 para modo espera
- **Sistema de interrupção inteligente**: Mínimo de 20 segundos por mensagem

### 🔧 Melhorias
- **Interface visual aprimorada**: Novos gradientes e efeitos visuais
- **Animações variadas**: 5 tipos diferentes de entrada para os cards
- **Emojis decorativos**: Elementos visuais flutuantes

## [1.0.0] - 2025-06-25

### 🎉 Lançamento Inicial
- Sistema completo de correio elegante
- Interface responsiva para celulares
- Telão interativo com fila inteligente
- Painel administrativo seguro
- Monitoramento em tempo real
- Estatísticas do evento
- Log persistente de mensagens 