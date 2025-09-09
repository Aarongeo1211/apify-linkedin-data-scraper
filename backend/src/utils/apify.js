const { ApifyClient } = require('apify-client');

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

// Helper function to safely extract string values from potentially complex objects
const safeExtractString = (value, fallback = 'N/A') => {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        return value.linkedinText || value.name || value.title || value.parsed || fallback;
    }
    return String(value);
};

// Helper function to extract username from LinkedIn URL
const extractUsernameFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    return match ? match[1] : null;
};

// Helper function to calculate total experience from a list of experiences
const calculateTotalExperience = (experiences) => {
    let totalMonths = 0;

    if (Array.isArray(experiences)) {
        for (const exp of experiences) {
            if (exp.duration) {
                const durationText = exp.duration.toLowerCase();
                const yearsMatch = durationText.match(/(\d+)\s*y/);
                const monthsMatch = durationText.match(/(\d+)\s*m/);
                const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 0;
                const mos = monthsMatch ? parseInt(monthsMatch[1], 10) : 0;
                totalMonths += (years * 12) + mos;
            } else if (exp.durationInMonths) {
                totalMonths += parseInt(exp.durationInMonths, 10);
            }
        }
    }

    if (totalMonths === 0) {
        return {
            years: 0,
            totalMonths: 0,
            experienceString: 'Experience not specified',
        };
    }

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    let experienceString = '';
    if (years > 0) {
        experienceString += `${years} year${years > 1 ? 's' : ''}`;
    }
    if (months > 0) {
        if (experienceString.length > 0) {
            experienceString += ' ';
        }
        experienceString += `${months} month${months > 1 ? 's' : ''}`;
    }

    return {
        years,
        totalMonths,
        experienceString,
    };
};


// Step 1: Search for LinkedIn profile URLs (separate function for chunked processing)
const searchLinkedInProfileUrls = async (searchCriteria) => {
    // Use the environment variable for the search actor, with a clear default
    const searchActorId = process.env.APIFY_SEARCH_ACTOR_ID || "harvestapi/linkedin-profile-search";
    
    let searchInput;

    // This block handles different input formats for various actors,
    // adapting the user-provided format for each.
    if (searchActorId.includes("logical_scrapers/linkedin-people-search")) {
        searchInput = {
            "currentCompanies": searchCriteria.company ? [searchCriteria.company] : [],
            "currentJobTitles": searchCriteria.title ? [searchCriteria.title] : [],
            "locations": searchCriteria.location ? [searchCriteria.location] : [],
            "maxItems": parseInt(searchCriteria.maxProfiles, 10) || 20,
            
            "profileScraperMode": "Short",
            "searchQuery": searchCriteria.title || "",
            "proxy": { // Note: logical_scrapers uses a nested 'proxy' object
                "useApifyProxy": true,
                "apifyProxyGroups": ["RESIDENTIAL"]
            }
        };
    } else {
        // Default input structure for harvestapi/linkedin-profile-search
        // Build the input object dynamically to avoid sending empty keys.
        searchInput = {
            "maxItems": parseInt(searchCriteria.maxProfiles, 10) || 20,
            "profileScraperMode": "Short", // Using the corrected value
            "proxySettings": {
                "useApifyProxy": true,
                "apifyProxyGroups": ["RESIDENTIAL"]
            }
        };

        if (searchCriteria.title) {
            searchInput.currentJobTitles = [searchCriteria.title];
            
            searchInput.searchQuery = searchCriteria.title;
        }

        if (searchCriteria.company) {
            searchInput.currentCompanies = [searchCriteria.company];
        }

        if (searchCriteria.location) {
            searchInput.locations = [searchCriteria.location];
        }
    }

    console.log(`Step 1: Searching for LinkedIn profiles using actor: ${searchActorId}`);
    console.log('Input:', JSON.stringify(searchInput, null, 2));

    const searchRun = await client.actor(searchActorId).call(searchInput);
    
    const { items: searchResults } = await client.dataset(searchRun.defaultDatasetId).listItems({ 
        limit: parseInt(searchCriteria.maxProfiles, 10) || 20 
    });
    
    console.log(`Found ${searchResults.length} profiles from search`);
    console.log('Sample search result:', searchResults[0]);
    
    // Extract profile URLs with flexible field mapping
    const profileUrls = searchResults
        .map(item => {
            // Try different possible field names for profile URLs
            const url = item.profileUrl || 
                       item.linkedinUrl || 
                       item.url || 
                       item.linkedin_url || 
                       item.profile_url ||
                       item.link ||
                       item.profileLink;
            console.log(`Extracted URL: ${url} from item with name: ${item.fullName || item.name}`);
            return url;
        })
        .filter(url => url && url.includes('linkedin.com/in/'))
        .slice(0, parseInt(searchCriteria.maxProfiles, 10) || 10);
    
    console.log('Final profile URLs to process:', profileUrls);
    return profileUrls;
};

// Helper function to transform detailed profile data
const transformProfileData = (detailedProfiles, profileUrls) => {
    return detailedProfiles.map((item, index) => {
        const originalUrl = item.originalProfileUrl || profileUrls[index] || '#';
        
        // Access the nested basic_info structure from the detail actor
        const basicInfo = item.basic_info || item;
        const experiences = item.experience || [];
        const currentPosition = experiences.length > 0 ? experiences[0] : {};
        
        // Extract education
        const education = item.education || [];
        const primaryEducation = education.length > 0 ? education[0] : {};
        
        // Extract skills
        const skills = item.skills || [];
        const skillNames = Array.isArray(skills) ? skills.slice(0, 5) : [];
        
        // Extract contact information - prioritize email from basic_info
        const email = basicInfo.email || item.email || 'N/A';
        const contactDetails = [];
        if (email && email !== 'N/A') {
            contactDetails.push(`Email: ${email}`);
        }
        
        // Extract other contact details
        const contactInfo = item.contact_info || item.contactInfo || {};
        if (contactInfo.phone || item.phone) {
            contactDetails.push(`Phone: ${contactInfo.phone || item.phone}`);
        }
        if (contactInfo.website || item.website) {
            contactDetails.push(`Website: ${contactInfo.website || item.website}`);
        }
        
        // Extract location information
        const location = basicInfo.location ? 
            (basicInfo.location.full || basicInfo.location.city || basicInfo.location.country) :
            (item.locationName || item.location);
        
        const { years, totalMonths, experienceString } = calculateTotalExperience(experiences);

        return {
            fullName: safeExtractString(basicInfo.fullname || basicInfo.first_name && basicInfo.last_name ? 
                `${basicInfo.first_name} ${basicInfo.last_name}` : 
                basicInfo.name || item.fullName),
            title: safeExtractString(basicInfo.headline || currentPosition.title || item.currentJobTitle),
            company: safeExtractString(basicInfo.current_company || currentPosition.company || currentPosition.companyName),
            location: safeExtractString(location),
            profileUrl: originalUrl,
            summary: safeExtractString(basicInfo.about || item.summary || item.bio, 'No summary available'),
            experience: experienceString,
            experienceInMonths: totalMonths,
            contactDetails: contactDetails.length > 0 ?
                contactDetails.join(' | ') :
                'No contact details available',
            email: safeExtractString(email),
            phone: safeExtractString(contactInfo.phone || item.phone),
            skills: skillNames.length > 0 ? skillNames.join(', ') : 'N/A',
            education: safeExtractString(primaryEducation.school || primaryEducation.degree || 'N/A'),
            connections: safeExtractString(basicInfo.connection_count || basicInfo.follower_count || item.connections),
            industry: safeExtractString(item.industryName || item.industry || 'Technology'),
            yearsOfExperience: years
        };
    });
};
// Step 2: Get detailed profile information for each URL with parallel processing
const getDetailedProfileData = async (profileUrls) => {
    const detailActorId = process.env.APIFY_DETAIL_ACTOR_ID || "apimaestro/linkedin-profile-detail";
    const detailedProfiles = [];
    
    console.log(`Step 2: Getting detailed data for ${profileUrls.length} profiles using parallel processing`);
    
    // Configure concurrency control
    const CONCURRENT_LIMIT = 3; // Process 3 profiles at a time to avoid rate limiting
    const batches = [];
    
    // Split URLs into batches for controlled parallel processing
    for (let i = 0; i < profileUrls.length; i += CONCURRENT_LIMIT) {
        batches.push(profileUrls.slice(i, i + CONCURRENT_LIMIT));
    }
    
    console.log(`Processing ${profileUrls.length} profiles in ${batches.length} batches of up to ${CONCURRENT_LIMIT} profiles each`);
    
    // Process each batch in parallel
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`\n=== Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} profiles ===`);
        
        // Create promises for all profiles in the current batch
        const batchPromises = batch.map(async (profileUrl, index) => {
            const globalIndex = batchIndex * CONCURRENT_LIMIT + index + 1;
            console.log(`[${globalIndex}/${profileUrls.length}] Starting processing for: ${profileUrl}`);
            
            try {
                const username = extractUsernameFromUrl(profileUrl);
                if (!username) {
                    console.warn(`[${globalIndex}/${profileUrls.length}] Could not extract username from URL: ${profileUrl}`);
                    return null;
                }
                
                console.log(`[${globalIndex}/${profileUrls.length}] Extracted username: ${username}`);
                
                // Use the profile detail actor with the correct input format
                const detailInput = {
                    "username": username
                };
                
                console.log(`[${globalIndex}/${profileUrls.length}] Calling detail actor for ${username}`);
                
                const detailRun = await client.actor(detailActorId).call(detailInput);
                const { items: detailResults } = await client.dataset(detailRun.defaultDatasetId).listItems();
                
                console.log(`[${globalIndex}/${profileUrls.length}] Detail actor returned ${detailResults.length} results for ${username}`);
                
                if (detailResults.length > 0) {
                    console.log(`[${globalIndex}/${profileUrls.length}] Successfully processed ${username}`);
                    return {
                        ...detailResults[0],
                        originalProfileUrl: profileUrl,
                        processedIndex: globalIndex // Keep track of processing order
                    };
                } else {
                    console.warn(`[${globalIndex}/${profileUrls.length}] No detailed results found for ${username}`);
                    return null;
                }
                
            } catch (error) {
                console.error(`[${globalIndex}/${profileUrls.length}] Failed to get details for profile ${profileUrl}:`, error.message);
                return null;
            }
        });
        
        // Wait for all promises in the current batch to complete
        console.log(`Waiting for batch ${batchIndex + 1} to complete...`);
        const batchResults = await Promise.all(batchPromises);
        
        // Add successful results to the main array
        const successfulResults = batchResults.filter(result => result !== null);
        detailedProfiles.push(...successfulResults);
        
        console.log(`Batch ${batchIndex + 1} completed. Successful: ${successfulResults.length}/${batch.length}. Total processed: ${detailedProfiles.length}/${profileUrls.length}`);
        
        // Add a small delay between batches to be respectful to the API
        if (batchIndex < batches.length - 1) {
            console.log('Waiting 1 second before next batch...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log(`\n=== Parallel processing completed ===`);
    console.log(`Successfully processed ${detailedProfiles.length} out of ${profileUrls.length} profiles`);
    
    // Transform the data before returning for chunked processing
    const transformedProfiles = transformProfileData(detailedProfiles, profileUrls);
    console.log(`Transformed ${transformedProfiles.length} profiles for return`);
    
    return transformedProfiles;
};

// Main function combining both steps
const scrapeLinkedInProfiles = async (searchCriteria) => {
    try {
        // Step 1: Search for profile URLs
        console.log('=== STEP 1: SEARCHING FOR PROFILE URLS ===');
        console.log('Search criteria received:', JSON.stringify(searchCriteria, null, 2));
        
        const profileUrls = await searchLinkedInProfileUrls(searchCriteria);
        
        if (profileUrls.length === 0) {
            console.log('No profile URLs found from search');
            return [];
        }
        
        console.log(`=== STEP 2: EXTRACTING DETAILED DATA FOR ${profileUrls.length} PROFILES ===`);
        
        // Step 2: Get detailed profile data - no timeout, let it complete
        const transformedProfiles = await getDetailedProfileData(profileUrls);
        
        // Return the already transformed profiles
        if (transformedProfiles && transformedProfiles.length > 0) {
            console.log(`Successfully processed ${transformedProfiles.length} detailed profiles`);
            return transformedProfiles;
        } else {
            console.log('No detailed profile data obtained - waiting longer or returning empty');
            return [];
        }
        
    } catch (error) {
        console.error('LinkedIn profile scraping failed:', error);
        return [];
    }
};

module.exports = { scrapeLinkedInProfiles, searchLinkedInProfileUrls, getDetailedProfileData };
