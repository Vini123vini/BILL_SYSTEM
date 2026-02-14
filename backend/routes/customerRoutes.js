const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

// All customer routes are protected (require authentication)
router.route('/')
  .get(protect, getCustomers)      // Get all customers
  .post(protect, createCustomer);  // Create new customer

router.route('/:id')
  .get(protect, getCustomer)       // Get single customer
  .put(protect, updateCustomer)    // Update customer
  .delete(protect, deleteCustomer); // Delete customer

module.exports = router;