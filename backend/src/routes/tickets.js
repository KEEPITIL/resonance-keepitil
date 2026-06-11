const router = require('express').Router();
const { protect, restrictTo, requireAgeVerification } = require('../middleware/auth');
const { createCheckout, stripeWebhook, getMyTickets, getTicket, checkIn } = require('../controllers/ticketController');
const express = require('express');

// Stripe webhook — raw body needed
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

router.post('/checkout', protect, requireAgeVerification, createCheckout);
router.get('/my', protect, getMyTickets);
router.get('/:ticketNumber', protect, getTicket);
router.post('/:ticketNumber/check-in', protect, restrictTo('organizer', 'admin'), checkIn);

module.exports = router;
