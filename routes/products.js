const express = require('express');
const {
  createProduct,
  getProducts,
  getAllProducts,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Public routes
router.get('/', getProducts);

// Protected routes (admin only)
router.use(protect, adminOnly);
router.post('/', createProduct);
router.get('/all', getAllProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;