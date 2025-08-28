const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// Add Operator (already exists)
const addOperator = async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      password: hashedPassword,
      role: 'operator',
    });

    res.status(201).json({ message: 'Operator created successfully' });
  } catch (err) {
    console.error('Error creating operator:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Get All Operators
const getOperators = async (req, res) => {
  try {
    const operators = await User.findAll({
      where: { role: 'operator' },
      attributes: ['id', 'username', 'role'], // don’t return password
    });
    res.status(200).json(operators);
  } catch (err) {
    console.error('Error fetching operators:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Delete Operator
const deleteOperator = async (req, res) => {
  const { id } = req.params;
  try {
    const operator = await User.findByPk(id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    await operator.destroy();
    res.status(200).json({ message: 'Operator deleted successfully' });
  } catch (err) {
    console.error('Error deleting operator:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Reset Operator Password
const resetPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    const operator = await User.findByPk(id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    operator.password = hashedPassword;
    await operator.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addOperator,
  getOperators,
  deleteOperator,
  resetPassword,
};
