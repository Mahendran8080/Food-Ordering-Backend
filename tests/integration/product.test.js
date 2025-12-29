

const request = require('supertest');
const app = require('../../server');
const mongoose = require('mongoose');

// MOCK REDIS: This prevents the test from trying to connect to a real Redis server
jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(true),
  quit: jest.fn().mockResolvedValue(true)
}));

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Product API Integration', () => {
  it('GET /api/products should return success', async () => {
    const res = await request(app).get('/api/products');
    
    // If you still get 500, check the console output in Jenkins 
    // to see the actual error message from your Error Middleware.
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  }, 100000); 
});