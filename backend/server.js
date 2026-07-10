const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

const equationRoutes = require('./routes/equation');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount routes
app.use('/api', equationRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
