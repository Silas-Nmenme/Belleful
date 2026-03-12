const express = require('express');
const router = express.Router();

// Stub
router.get('/', (req, res) => {
  res.json({ message: 'Menu routes stub' });
});

module.exports = router;

