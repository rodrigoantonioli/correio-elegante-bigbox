const request = require('supertest');
const ioClient = require('socket.io-client');

process.env.ADMIN_PASSWORD = 'testpass';
process.env.SESSION_SECRET = 'testsecret';
const { app, server, io, shutdown } = require('../server');

describe('Concurrent clients', () => {
  let httpServer;
  let port;

  beforeAll(done => {
    httpServer = server.listen(0, () => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll(done => {
    shutdown();
    httpServer.close(done);
  });

  test('handles 50 clients sending messages', async () => {
    const clientCount = 50;
    const sockets = [];
    const sendPromises = [];

    for (let i = 0; i < clientCount; i++) {
      const socket = ioClient(`http://localhost:${port}`, { transports: ['websocket'], forceNew: true, reconnection: false });
      sockets.push(socket);
      sendPromises.push(new Promise(resolve => {
        socket.on('connect', () => {
          socket.emit('newMessage', {
            recipient: `Dest ${i}`,
            sender: `Sender ${i}`,
            message: `Msg ${i}`,
            id: i
          });
        });
        socket.on('queueUpdate', () => {
          resolve();
        });
      }));
    }

    await Promise.all(sendPromises);

    // Aguarda o processamento completo no servidor
    await new Promise(r => setTimeout(r, 500));

    sockets.forEach(s => s.close());

    const agent = request.agent(app);
    await agent
      .post('/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(`password=${process.env.ADMIN_PASSWORD}`);

    const res = await agent.get('/api/history');
    expect(res.status).toBe(200);
    expect(res.body.log.length).toBeGreaterThanOrEqual(clientCount);
  }, 15000);
});
