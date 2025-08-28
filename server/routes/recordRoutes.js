// routes/recordRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Record = require('../models/Record');
const db = require('../config/db');


const path = require('path');
const fs = require('fs');

// configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/signatures');
    fs.mkdirSync(uploadPath, { recursive: true }); // ensure folder exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// POST: Save record with signature image
router.post('/', upload.single('signature'), async (req, res) => {
  try {
    const {
      serialNo, flightNo, date, aircraftType, parkingStand,
      regNo, airline, onBlock, offBlock, origin,
      gpuStart, gpuEnd, pcaStart, pcaEnd,
      operatorName, shift, ghaName
    } = req.body;

    const signaturePath = req.file ? `/uploads/signatures/${req.file.filename}` : null;

    await db.query(
      `INSERT INTO records (
        serialNo, flightNo, date, aircraftType, parkingStand,
        regNo, airline, onBlock, offBlock, origin,
        gpuStart, gpuEnd, pcaStart, pcaEnd,
        operatorName, shift, ghaName, gha_signature,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [
          serialNo, flightNo, date, aircraftType, parkingStand,
          regNo, airline, onBlock, offBlock, origin,
          gpuStart, gpuEnd, pcaStart, pcaEnd,
          operatorName, shift, ghaName, signaturePath
        ],
        type: db.QueryTypes.INSERT
      }
    );

    res.status(201).json({ message: "Record saved successfully" });
  } catch (error) {
    console.error('Error saving record:', error);
    res.status(500).json({ error: 'Failed to save record' });
  }
});



// GET: Fetch all records
router.get('/', async (req, res) => {
  try {
    const records = await Record.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

module.exports = router;
