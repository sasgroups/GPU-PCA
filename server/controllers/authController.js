const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.login = async (req, res) => {
const { username, password } = req.body;
console.log("Login attempt:", username, password);

try {
const user = await User.findOne({ where: { username } });
if (!user) return res.status(401).json({ message: "Invalid credentials" });


const isMatch = await bcrypt.compare(password, user.password);
console.log("Password match:", isMatch);
if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

res.json({ token, role: user.role, username: user.username });
} catch (err) {
console.error("Login error:", err);
res.status(500).json({ message: "Server error" });
}
};