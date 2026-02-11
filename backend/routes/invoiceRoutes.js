const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getDashboardStats
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

// Dashboard stats route
router.get('/stats/dashboard', protect, getDashboardStats);

// All invoice routes are protected (require authentication)
router.route('/')
  .get(protect, getInvoices)      // Get all invoices
  .post(protect, createInvoice);  // Create new invoice

router.route('/:id')
  .get(protect, getInvoice)       // Get single invoice
  .put(protect, updateInvoice)    // Update invoice
  .delete(protect, deleteInvoice); // Delete invoice

module.exports = router;