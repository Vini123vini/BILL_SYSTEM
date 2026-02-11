const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 }); // Sort by newest first
    
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error.message);
    res.status(500).json({ message: 'Server error fetching customers' });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if user owns this customer
    if (customer.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this customer' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error.message);
    res.status(500).json({ message: 'Server error fetching customer' });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Validation
    if (!name || !email || !phone || !address) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create customer
    const customer = await Customer.create({
      name,
      email,
      phone,
      address,
      createdBy: req.user._id
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error.message);
    res.status(500).json({ message: 'Server error creating customer' });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if user owns this customer
    if (customer.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this customer' });
    }

    // Update customer
    const { name, email, phone, address } = req.body;
    
    customer.name = name || customer.name;
    customer.email = email || customer.email;
    customer.phone = phone || customer.phone;
    customer.address = address || customer.address;

    const updatedCustomer = await customer.save();

    res.json(updatedCustomer);
  } catch (error) {
    console.error('Update customer error:', error.message);
    res.status(500).json({ message: 'Server error updating customer' });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if user owns this customer
    if (customer.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this customer' });
    }

    await customer.deleteOne();

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error.message);
    res.status(500).json({ message: 'Server error deleting customer' });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};