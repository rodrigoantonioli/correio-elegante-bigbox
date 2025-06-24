const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID;
const GIST_FILENAME = process.env.GIST_FILENAME || 'message_history.log';

async function appendToGist(content) {
  if (!GITHUB_TOKEN || !GIST_ID) {
    return;
  }
  try {
    const existing = await fetchGist();
    const file = existing.files && existing.files[GIST_FILENAME];
    const newContent = (file ? file.content : '') + content;
    await updateGist(newContent);
  } catch (err) {
    console.error('Erro ao atualizar gist:', err);
  }
}

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
