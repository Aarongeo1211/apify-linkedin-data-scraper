const express = require('express');
const router = express.Router();
const { scrapeLinkedInProfiles } = require('../utils/apify');
const { generateExcel } = require('../utils/excel');
const { generatePdf } = require('../utils/pdf');
const { createApplicantInCeipal } = require('../utils/ceipal');

// POST /api/scrape
router.post('/scrape', async (req, res) => {
    try {
        const results = await scrapeLinkedInProfiles(req.body);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error scraping data', details: error.message });
    }
});

// POST /api/download/excel
router.post('/download/excel', async (req, res) => {
    try {
        const buffer = await generateExcel(req.body.data);
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment('linkedin-profiles.xlsx');
        res.send(buffer);
    } catch (error) {
        res.status(500).send('Error generating Excel file');
    }
});

// POST /api/download/pdf
router.post('/download/pdf', async (req, res) => {
    try {
        const buffer = await generatePdf(req.body.profile);
        const fileName = (req.body.profile.fullName || 'profile').replace(/\s+/g, '_');
        res.header('Content-Type', 'application/pdf');
        res.attachment(`${fileName}.pdf`);
        res.send(buffer);
    } catch (error) {
        res.status(500).send('Error generating PDF');
    }
});

// POST /api/ceipal/sync
router.post('/ceipal/sync', async (req, res) => {
    try {
        const result = await createApplicantInCeipal(req.body.profile);
        res.json({ message: 'Successfully synced profile to Ceipal', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Error syncing data to Ceipal', details: error.message });
    }
});

module.exports = router;