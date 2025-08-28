const express = require('express');
const router = express.Router();
const gateController = require('../controllers/gateController');

router.post('/gates', gateController.createGate);
router.get('/gates', gateController.getGates);
router.delete('/gates/:id', gateController.deleteGate);
router.get('/gates/:serial_no', gateController.getGateBySerial);


module.exports = router;
