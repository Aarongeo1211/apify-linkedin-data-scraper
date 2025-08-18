require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

// Debug: Log the current actor configuration
console.log('=== ACTOR CONFIGURATION ===');
console.log('SEARCH_ACTOR_ID:', process.env.APIFY_SEARCH_ACTOR_ID);
console.log('DETAIL_ACTOR_ID:', process.env.APIFY_DETAIL_ACTOR_ID);
console.log('API_TOKEN exists:', !!process.env.APIFY_API_TOKEN);
console.log('============================');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase payload size limit for data

// API Routes
app.use('/api', apiRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
