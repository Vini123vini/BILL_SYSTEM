const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ createdBy: req.user._id })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 }); // Sort by newest first
    
    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error.message);
    res.status(500).json({ message: 'Server error fetching invoices' });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user owns this invoice
    if (invoice.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error.message);
    res.status(500).json({ message: 'Server error fetching invoice' });
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const { customerId, items, notes } = req.body;

    // Validation
    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Please provide customer and at least one item' });
    }

    // Verify customer exists and belongs to user
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    if (customer.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to use this customer' });
    }

    // Process items and calculate totals
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      // Verify product exists
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
      if (product.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to use this product' });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      // Calculate item subtotal
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      // Update product stock
      product.stock -= item.quantity;
      await product.save();

      // Add processed item
      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal
      });
    }

    // Calculate tax and total
    const taxRate = 5; // 5% tax
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // Create invoice
    const invoice = await Invoice.create({
      customer: customerId,
      customerName: customer.name,
      items: processedItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: notes || '',
      createdBy: req.user._id
    });

    // Populate and return
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name');

    res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error('Create invoice error:', error.message);
    res.status(500).json({ message: 'Server error creating invoice' });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user owns this invoice
    if (invoice.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this invoice' });
    }

    // Update only status and notes for simplicity
    const { status, notes } = req.body;

    if (status) {
      if (!['pending', 'paid', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      invoice.status = status;
    }

    if (notes !== undefined) {
      invoice.notes = notes;
    }

    const updatedInvoice = await invoice.save();

    // Populate and return
    const populatedInvoice = await Invoice.findById(updatedInvoice._id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name');

    res.json(populatedInvoice);
  } catch (error) {
    console.error('Update invoice error:', error.message);
    res.status(500).json({ message: 'Server error updating invoice' });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user owns this invoice
    if (invoice.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this invoice' });
    }

    // Restore product stock
    for (const item of invoice.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    await invoice.deleteOne();

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error.message);
    res.status(500).json({ message: 'Server error deleting invoice' });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/invoices/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    // Get total customers
    const totalCustomers = await Customer.countDocuments({ createdBy: req.user._id });

    // Get total invoices
    const totalInvoices = await Invoice.countDocuments({ createdBy: req.user._id });

    // Get total revenue
    const invoices = await Invoice.find({ createdBy: req.user._id, status: 'paid' });
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);

    // Get recent invoices
    const recentInvoices = await Invoice.find({ createdBy: req.user._id })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalCustomers,
      totalInvoices,
      totalRevenue,
      recentInvoices
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error.message);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getDashboardStats
};