const Order = require('../models/Order');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../config/redis');

const generateTokenNumber = async () => {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });
  if (!lastOrder) return 'T1001';
  
  const lastTokenNumber = lastOrder.tokenNumber;
  const lastNumber = parseInt(lastTokenNumber.replace('T', ''));
  return `T${lastNumber + 1}`;
};

const createOrder = async (req, res) => {
  try {
    const { productId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product || !product.availability) {
      return res.status(400).json({
        success: false, 
        message: !product ? 'Product not found' : 'Product is not available'
      });
    }

    const orderId = uuidv4();
    const tokenNumber = await generateTokenNumber();

    const order = await Order.create({
      orderId,
      userId: req.user._id,
      productId: product._id,
      price: product.price,
      paymentStatus: 'done',
      tokenNumber
    });

    await order.populate([
      { path: 'userId', select: 'name email' },
      { path: 'productId', select: 'name price category' }
    ]);

    // CACHE INVALIDATION: Clear this specific user's order history cache
    await redisClient.del(`orders:${req.user._id}`);
    // Clear global admin orders cache
    await redisClient.del('admin_all_orders');

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = `orders:${userId}`;

    // 1. Try Cache
    const cachedOrders = await redisClient.get(cacheKey);
    if (cachedOrders) {
      return res.json({
        success: true,
        source: 'cache',
        count: JSON.parse(cachedOrders).length,
        data: JSON.parse(cachedOrders)
      });
    }

    // 2. Fetch DB
    const orders = await Order.find({ userId })
      .populate('productId', 'name price category')
      .sort({ createdAt: -1 });

    // 3. Set Cache (5 Minutes - shorter because order status updates)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(orders));

    res.json({
      success: true,
      source: 'database',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const cacheKey = 'admin_all_orders';

    const cachedOrders = await redisClient.get(cacheKey);
    if (cachedOrders) {
      return res.json({
        success: true,
        source: 'cache',
        count: JSON.parse(cachedOrders).length,
        data: JSON.parse(cachedOrders)
      });
    }

    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('productId', 'name price category')
      .sort({ createdAt: -1 });

    await redisClient.setEx(cacheKey, 300, JSON.stringify(orders));

    res.json({
      success: true,
      source: 'database',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate([
      { path: 'userId', select: 'name email' },
      { path: 'productId', select: 'name price category' }
    ]);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // --- WEBSOCKET REAL-TIME UPDATE ---
    const io = req.app.get('io');
    const orderIdStr = order._id.toString();
    
    // Emit status update to the specific room created for this order
    io.to(orderIdStr).emit('statusUpdate', {
      orderId: orderIdStr,
      status: order.status,
      message: `Your order status is now: ${order.status}`
    });

    // Invalidate User's history cache AND Admin history cache
    await redisClient.del(`orders:${order.userId._id}`);
    await redisClient.del('admin_all_orders');

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  generateTokenNumber
};