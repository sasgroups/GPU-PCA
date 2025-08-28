const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const recordRoutes = require('./routes/recordRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const gateRoutes = require('./routes/gateRoutes');
const { sequelize } = require('./models');
dotenv.config();
const app = express();
const path = require('path');



app.use(cors());
app.use(express.json());

app.use('/api/records', recordRoutes);
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', gateRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  app.listen(process.env.PORT || 5000, () => {
    console.log('Server started on port 5000');
  });
});
