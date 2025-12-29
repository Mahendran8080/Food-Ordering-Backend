const Product = require('../models/Product');
const redisClient = require('../config/redis');

// Helper to clear the main product cache
const clearProductCache = async () => {
  await redisClient.del('available_products');
  await redisClient.del('all_products_admin');
};

const createProduct = async (req, res) => {
  try {
    const { name, price, availability, description, category } = req.body;
    
    const product = await Product.create({
      name,
      price,
      availability,
      description,
      category,
      createdBy: req.user._id
    });

    await product.populate('createdBy', 'name email');

    // Invalidate cache because a new product exists
    await clearProductCache();

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const cacheKey = 'available_products';

    // 1. Try Cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        source: 'cache',
        count: JSON.parse(cachedData).length,
        data: JSON.parse(cachedData)
      });
    }

    // 2. Fetch from DB
    const products = await Product.find({ availability: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // 3. Store in Cache (1 Hour)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(products));

    res.json({
      success: true,
      source: 'database',
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const cacheKey = 'all_products_admin';

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        source: 'cache',
        count: JSON.parse(cachedData).length,
        data: JSON.parse(cachedData)
      });
    }

    const products = await Product.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(products));

    res.json({
      success: true,
      source: 'database',
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Invalidate cache because data changed
    await clearProductCache();

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Invalidate cache
    await clearProductCache();

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getAllProducts,
  updateProduct,
  deleteProduct
};