const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID;
const GIST_FILENAME = process.env.GIST_FILENAME || 'message_history.log';

// Sistema de buffer para acumular mensagens
let messageBuffer = [];
let flushTimeout = null;
const BUFFER_SIZE = 10; // Envia a cada 10 mensagens
const BUFFER_TIMEOUT = 60000; // Ou a cada 60 segundos

async function appendToGist(content) {
  if (!GITHUB_TOKEN || !GIST_ID) {
    return;
  }
  
  // Se for um log de sistema (começa com === ou \n===), envia imediatamente
  if (content.includes('===')) {
    return flushBuffer(content);
  }
  
  // Adiciona ao buffer
  messageBuffer.push(content.trim());
  
  // Se atingiu o tamanho do buffer, envia
  if (messageBuffer.length >= BUFFER_SIZE) {
    return flushBuffer();
  }
  
  // Agenda envio por timeout se não houver um agendado
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushBuffer();
    }, BUFFER_TIMEOUT);
  }
}

async function flushBuffer(additionalContent = '') {
  if (messageBuffer.length === 0 && !additionalContent) {
    return;
  }
  
  // Cancela timeout se existir
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  
  try {
    const existing = await fetchGist();
    const file = existing.files && existing.files[GIST_FILENAME];
    
    // Prepara conteúdo do buffer
    let bufferContent = '';
    if (messageBuffer.length > 0) {
      bufferContent = messageBuffer.join('\n') + '\n';
      messageBuffer = []; // Limpa o buffer
    }
    
    const newContent = (file ? file.content : '') + bufferContent + additionalContent;
    await updateGist(newContent);
  } catch (err) {
    console.error('Erro ao atualizar gist:', err);
    // Em caso de erro, mantém as mensagens no buffer para tentar novamente
    if (bufferContent) {
      messageBuffer = bufferContent.split('\n').filter(Boolean).concat(messageBuffer);
    }
  }
}

// Garante que o buffer seja enviado antes do processo encerrar
process.on('SIGTERM', async () => {
  console.log('Enviando buffer antes de encerrar...');
  await flushBuffer('\n=== SERVIDOR ENCERRADO ===\n' + 
    `Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n` +
    `========================\n\n');
});

function fetchGist() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/gists/${GIST_ID}`,
      method: 'GET',
      headers: {
        'User-Agent': 'correio-elegante',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https
      .get(options, res => {
        let body = '';
        res.on('data', chunk => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function updateGist(content) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      files: {
        [GIST_FILENAME]: { content }
      }
    });

    const options = {
      hostname: 'api.github.com',
      path: `/gists/${GIST_ID}`,
      method: 'PATCH',
      headers: {
        'User-Agent': 'correio-elegante',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, res => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = { appendToGist };
