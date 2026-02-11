const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 }); // Sort by newest first
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product
    if (product.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this product' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error.message);
    res.status(500).json({ message: 'Server error fetching product' });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const { name, price, stock, description } = req.body;

    // Validation
    if (!name || !price || stock === undefined) {
      return res.status(400).json({ message: 'Please provide name, price, and stock' });
    }

    if (price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    if (stock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    // Create product
    const product = await Product.create({
      name,
      price,
      stock,
      description: description || '',
      createdBy: req.user._id
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product
    if (product.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Update product
    const { name, price, stock, description } = req.body;
    
    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    product.name = name || product.name;
    product.price = price !== undefined ? price : product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.description = description !== undefined ? description : product.description;

    const updatedProduct = await product.save();

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product
    if (product.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error.message);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};