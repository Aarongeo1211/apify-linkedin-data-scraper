const axios = require('axios');

// --- Ceipal API Configuration ---
const CEIPAL_AUTH_URL = 'https://api.ceipal.com/v1/createAuthtoken/';
const CEIPAL_PUSH_URL = 'https://api.ceipal.com/savecustomapplicantdetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/8912cd4c649e5d956c0011191088e21a/';

/**
 * Generates an authentication token from Ceipal.
 * IMPORTANT: Ensure CEIPAL_EMAIL, CEIPAL_PASSWORD, and CEIPAL_API_KEY are set in your .env file.
 * @returns {Promise<string>} The authentication token.
 */
const getAuthToken = async () => {
    const credentials = {
        email: process.env.CEIPAL_EMAIL,
        password: process.env.CEIPAL_PASSWORD,
        api_key: process.env.CEIPAL_API_KEY,
        json: 1,
    };

    try {
        const response = await axios.post(CEIPAL_AUTH_URL, credentials);
        
        // Assuming the token is in response.data.token based on standard practices
        if (response.data && response.data.access_token) {
            console.log('Successfully authenticated with Ceipal.');
            return response.data.access_token;
        } else {
            // Log the actual response if the token isn't where we expect it
            console.error('Ceipal auth response did not contain a token:', response.data);
            throw new Error('Could not find token in Ceipal authentication response.');
        }
    } catch (error) {
        console.error('Error getting Ceipal auth token:', error.response ? error.response.data : error.message);
        throw new Error('Could not authenticate with Ceipal.');
    }
};

/**
 * Pushes a new applicant's data to Ceipal.
 * @param {object} profileData - The scraped profile data from LinkedIn.
 * @returns {Promise<object>} The response from the Ceipal API.
 */
const createApplicantInCeipal = async (profileData) => {
    const token = await getAuthToken();

    // Map the scraped data to the Ceipal applicant JSON format
    const location = profileData.location || {};
    const city = location.city || '';

    let years = '';
    let months = '';
    if (profileData.duration && profileData.duration !== 'N/A') {
        const durationStr = profileData.duration;
        const parts = durationStr.split('·');
        if (parts.length > 1) {
            const expStr = parts[1].trim();
            const yearMatch = expStr.match(/(\d+)\s+yrs?/);
            const monthMatch = expStr.match(/(\d+)\s+mos?/);
            if (yearMatch) {
                years = yearMatch[1];
            }
            if (monthMatch) {
                months = monthMatch[1];
            }
        }
    }

    // Generate a placeholder email if none is provided, as it's a mandatory field.
    const email = (profileData.email && profileData.email !== 'N/A') 
        ? profileData.email 
        : `${(profileData.fullName || 'candidate').replace(/\s+/g, '.').toLowerCase()}@no-email-provided.com`;

    let comments = profileData.summary || '';
    if (profileData.location && profileData.location !== 'N/A') {
        comments = `Location: ${profileData.location}. ${comments}`;
    }
    if (!profileData.email || profileData.email === 'N/A') {
        comments = `Email not found during scrape. ${comments}`;
    }

    const applicantData = [{
        first_name: profileData.fullName ? profileData.fullName.split(' ')[0] : '',
        last_name: profileData.fullName ? profileData.fullName.split(' ').slice(1).join(' ') : '',
        email_address: email,
        mobile_number: profileData.phone === 'N/A' ? '' : profileData.phone,
        linkedin_profile_url: profileData.profileUrl || '',
        job_title: (profileData.title || '').substring(0, 250),
        current_company: profileData.company || '',
        skills: profileData.skills === 'N/A' ? '' : profileData.skills,
        industry: profileData.industry || '',
        additional_comments: comments.substring(0, 250),
        experience_years: years,
        experience_months: months,
        city: city,
        filename: "", // Required by API, even if empty
        resume_content: "", // Required by API, even if empty
        source: {
            "id": 6,
            "name": "LinkedIn"
        },
    }];

    try {
        console.log('Pushing the following data to Ceipal:', JSON.stringify(applicantData, null, 2));
        const response = await axios.post(CEIPAL_PUSH_URL, applicantData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Successfully created applicant in Ceipal.');
        return response.data;
    } catch (error) {
        console.error('Error creating Ceipal applicant:', error.response ? error.response.data : error.message);
        throw new Error('Could not create applicant in Ceipal.');
    }
};

module.exports = {
    createApplicantInCeipal,
};
