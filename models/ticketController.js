// ticketController.js
const db = require('../server').db
const Ticket = require('../models/ticket');

exports.createTicket = async (req, res) => {
  const { title, description } = req.body;

  try {
    const ticket = await Ticket.create({
      title,
      description
    });

    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
exports.createTicket = (req, res) => {
    const { title, description, priority } = req.body;
    const user_id = req.session.user_id;
    
    db.query('INSERT INTO tickets SET ?', { title, description, priority, user_id }, (err, result) => {
      if (err) {
        console.log(err);
        res.send({ success: false, message: 'Error al crear el ticket' });
      } else {
        console.log(result);
        res.send({ success: true, message: 'Ticket creado.' });
      }
    });
  };
  
  // Función para ver un ticket
  exports.viewTicket = (req, res) => {
    const ticket_id = req.params.id;
    
    db.query('SELECT * FROM tickets WHERE id = ?', ticket_id, (err, results) => {
      if (err) {
        console.log(err);
        res.send({ success: false, message: 'Error al encontrar al ticket' });
      } else {
        db.query('SELECT * FROM tickets WHERE id = ?', ticket_id, (err, results2) => {
            if (err) {
              console.log(err);
              res.send({ success: false, message: 'Error al encontrar al ticket' });
            }
        console.log(results);
        const ticket = results[0];
        res.render('ticket', { ticket, user: req.user, ticket_response: results2});
      })}
    });
  }