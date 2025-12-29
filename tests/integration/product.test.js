const request = require('supertest');
const app = require('../../server'); // Ensure you export 'app' in server.js

describe('Product API Integration', () => {
  // Increase timeout to 10 seconds (10000ms) for this test
  it('GET /api/products should return success', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  }, 100000); 
});