const request = require('supertest');

// Set environment variables before requiring the server
process.env.ADMIN_PASSWORD = 'testpass';
process.env.SESSION_SECRET = 'testsecret';
const { app } = require('../server');

describe('Correio Elegante server', () => {
  test('GET /api/check-auth returns unauthenticated by default', async () => {
    const res = await request(app).get('/api/check-auth');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });

  test('POST /login with wrong password redirects to /login?error=1', async () => {
    const res = await request(app)
      .post('/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('password=wrong');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login?error=1');
  });

  test('Successful login creates session and /api/check-auth returns authenticated', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(`password=${process.env.ADMIN_PASSWORD}`)
      .expect(302)
      .expect('Location', '/admin');

    const res = await agent.get('/api/check-auth');
    expect(res.body.authenticated).toBe(true);
  });
});
