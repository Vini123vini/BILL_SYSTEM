const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

// All product routes are protected (require authentication)
router.route('/')
  .get(protect, getProducts)      // Get all products
  .post(protect, createProduct);  // Create new product

router.route('/:id')
  .get(protect, getProduct)       // Get single product
  .put(protect, updateProduct)    // Update product
  .delete(protect, deleteProduct); // Delete product

module.exports = router;