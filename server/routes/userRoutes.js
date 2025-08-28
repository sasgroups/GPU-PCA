const express = require('express');
const router = express.Router();
const { 
  addOperator, 
  getOperators, 
  deleteOperator, 
  resetPassword 
} = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Add operator
router.post('/add-operator', verifyToken, isAdmin, addOperator);

// Get all operators
router.get('/operators', verifyToken, isAdmin, getOperators);

// Delete operator
router.delete('/operator/:id', verifyToken, isAdmin, deleteOperator);

// Reset operator password
router.put('/operator/:id/reset-password', verifyToken, isAdmin, resetPassword);

module.exports = router;
