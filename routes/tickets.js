// routes/tickets.js
const express = require('express');
const Ticket = require('../models/ticket');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const tickets = await Ticket.findAll({ where: { userId } });
    res.render('tickets/index', { tickets });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
