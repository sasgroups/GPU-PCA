const Gate = require('../models/gateModel');

// 📌 Create a new gate
exports.createGate = async (req, res) => {
  try {
    // Get last gate to increment both serial_no and gate_name
    const lastGate = await Gate.findOne({ order: [['createdAt', 'DESC']] });

    // Gate name: Gate 1, Gate 2, ...
    const gate_number = lastGate ? parseInt(lastGate.gate_name.split(' ')[1]) + 1 : 1;
    const gate_name = `Gate ${gate_number}`;

    // Serial no: 5-digit unique (start from 10000)
    const serial_no = lastGate ? lastGate.serial_no + 1 : 10000;

    const newGate = await Gate.create({ serial_no, gate_name });
    res.status(201).json(newGate);
  } catch (err) {
    console.error('Error creating gate:', err);
    res.status(500).json({ message: 'Server error while creating gate' });
  }
};

// 📌 Get all gates
exports.getGates = async (req, res) => {
  try {
    const gates = await Gate.findAll({ order: [['createdAt', 'DESC']] });
    res.json(gates);
  } catch (error) {
    console.error('Error fetching gates:', error);
    res.status(500).json({ message: 'Failed to fetch gates' });
  }
};

// 📌 Delete a gate
exports.deleteGate = async (req, res) => {
  try {
    const { id } = req.params;
    await Gate.destroy({ where: { id } });
    res.json({ message: 'Gate deleted successfully' });
  } catch (error) {
    console.error('Error deleting gate:', error);
    res.status(500).json({ message: 'Failed to delete gate' });
  }
};
// 📌 Get a gate by serial number
exports.getGateBySerial = async (req, res) => {
  try {
    const { serial_no } = req.params;
    const gate = await Gate.findOne({ where: { serial_no } });

    if (!gate) {
      return res.status(404).json({ message: 'Gate not found' });
    }

    res.json(gate);
  } catch (error) {
    console.error('Error fetching gate:', error);
    res.status(500).json({ message: 'Failed to fetch gate' });
  }
};
