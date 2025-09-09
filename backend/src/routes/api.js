const express = require('express');
const router = express.Router();
const { scrapeLinkedInProfiles, searchLinkedInProfileUrls, getDetailedProfileData } = require('../utils/apify');
const { generateExcel } = require('../utils/excel');
const { generatePdf } = require('../utils/pdf');
const { createApplicantInCeipal } = require('../utils/ceipal');

// POST /api/scrape - Original combined approach (for backward compatibility)
router.post('/scrape', async (req, res) => {
    try {
        const results = await scrapeLinkedInProfiles(req.body);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error scraping data', details: error.message });
    }
});

// POST /api/search-urls - Step 1: Get profile URLs only
router.post('/search-urls', async (req, res) => {
    try {
        console.log('API: Getting profile URLs for criteria:', req.body);
        const profileUrls = await searchLinkedInProfileUrls(req.body);
        console.log(`API: Found ${profileUrls.length} profile URLs`);
        res.json(profileUrls);
    } catch (error) {
        console.error('API: Error getting profile URLs:', error.message);
        res.status(500).json({ message: 'Error searching for profile URLs', details: error.message });
    }
});

// POST /api/scrape-details - Step 2: Get detailed data for specific URLs
router.post('/scrape-details', async (req, res) => {
    try {
        const { profileUrls } = req.body;
        if (!profileUrls || !Array.isArray(profileUrls)) {
            return res.status(400).json({ message: 'profileUrls array is required' });
        }
        
        console.log(`API: Getting detailed data for ${profileUrls.length} profile URLs`);
        const detailedProfiles = await getDetailedProfileData(profileUrls);
        console.log(`API: Processed ${detailedProfiles.length} detailed profiles`);
        res.json(detailedProfiles);
    } catch (error) {
        console.error('API: Error getting detailed profile data:', error.message);
        res.status(500).json({ message: 'Error extracting detailed profile data', details: error.message });
    }
});

// POST /api/download/excel
router.post('/download/excel', async (req, res) => {
    try {
        const { data } = req.body;
        
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ message: 'Invalid data: Expected array of profiles' });
        }
        
        if (data.length === 0) {
            return res.status(400).json({ message: 'No data provided for Excel generation' });
        }
        
        console.log(`API: Generating Excel file for ${data.length} profiles`);
        console.log('API: Sample profile data:', JSON.stringify(data[0], null, 2));
        
        const buffer = await generateExcel(data);
        
        console.log(`API: Excel file generated successfully, size: ${buffer.length} bytes`);
        
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment('linkedin-profiles.xlsx');
        res.send(buffer);
        
    } catch (error) {
        console.error('API: Error generating Excel file:', error);
        res.status(500).json({ 
            message: 'Error generating Excel file', 
            details: error.message 
        });
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