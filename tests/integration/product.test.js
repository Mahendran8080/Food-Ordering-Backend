const request = require('supertest');
const app = require('../../server'); // Ensure you export 'app' in server.js

describe('Product API Integration', () => {
  it('GET /api/products should return success', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});