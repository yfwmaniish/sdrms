const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// Create new subscriber
router.post('/', authMiddleware, rateLimiter, [
  check('subscriberName').notEmpty().withMessage('Subscriber name is required'),
  check('mobileNumber').isMobilePhone('en-IN').withMessage('Valid mobile number is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const subscriber = new Subscriber(req.body);
    await subscriber.save();
    res.status(201).json(subscriber);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get subscriber by ID
router.get('/:id', authMiddleware, rateLimiter, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json(subscriber);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update subscriber details
router.put('/:id', authMiddleware, rateLimiter, async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json(subscriber);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete subscriber
router.delete('/:id', authMiddleware, rateLimiter, async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json({ message: 'Subscriber deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search subscribers
router.get('/search', authMiddleware, rateLimiter, async (req, res) => {
  try {
    const query = req.query.q;
    const results = await Subscriber.searchByText(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
