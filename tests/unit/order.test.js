// Example: Testing logic without needing a real database
const { generateTokenNumber } = require('../../controllers/orderController');
const Order = require('../../models/Order');

const redisClient = require('../../config/redis'); // 1. Import the client

// We "mock" the database so we don't need MongoDB running for this test
jest.mock('../../models/Order');

afterAll(async () => {
  await redisClient.quit(); 
});

describe('Order Utility Tests', () => {
  it('should generate T1001 if no orders exist', async () => {
    Order.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null)
    });

    const token = await generateTokenNumber();
    expect(token).toBe('T1001');
  });

  it('should increment the token number correctly', async () => {
    Order.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue({ tokenNumber: 'T1005' })
    });

    const token = await generateTokenNumber();
    expect(token).toBe('T1006');
  });
});