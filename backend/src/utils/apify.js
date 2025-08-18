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


const searchLinkedInProfiles = async (searchCriteria) => {
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

// Step 2: Get detailed profile information for each URL
const getDetailedProfileData = async (profileUrls) => {
    const detailActorId = process.env.APIFY_DETAIL_ACTOR_ID || "apimaestro/linkedin-profile-detail";
    const detailedProfiles = [];
    
    console.log(`Step 2: Getting detailed data for ${profileUrls.length} profiles`);
    
    // Process profiles one by one to ensure proper tracking
    for (let i = 0; i < profileUrls.length; i++) {
        const profileUrl = profileUrls[i];
        console.log(`Processing profile ${i + 1}/${profileUrls.length}: ${profileUrl}`);
        
        try {
            const username = extractUsernameFromUrl(profileUrl);
            if (!username) {
                console.warn(`Could not extract username from URL: ${profileUrl}`);
                continue;
            }
            
            console.log(`Extracted username: ${username} from URL: ${profileUrl}`);
            
            // Use the profile detail actor with the correct input format
            const detailInput = {
                "username": username // Use the simple username format that works
            };
            
            console.log(`Calling detail actor for ${username} with input:`, JSON.stringify(detailInput, null, 2));
            
            const detailRun = await client.actor(detailActorId).call(detailInput);
            const { items: detailResults } = await client.dataset(detailRun.defaultDatasetId).listItems();
            
            console.log(`Detail actor returned ${detailResults.length} results for ${username}`);
            
            if (detailResults.length > 0) {
                console.log(`Sample detail result for ${username}:`, JSON.stringify(detailResults[0], null, 2));
                detailedProfiles.push({
                    ...detailResults[0],
                    originalProfileUrl: profileUrl // Keep original URL for reference
                });
            } else {
                console.warn(`No detailed results found for ${username}`);
            }
            
        } catch (error) {
            console.error(`Failed to get details for profile ${profileUrl}:`, error.message);
            // Continue with next profile instead of failing completely
        }
        
        // Add delay between requests to be respectful
        if (i < profileUrls.length - 1) {
            console.log('Waiting 2 seconds before next request...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`Successfully processed ${detailedProfiles.length} detailed profiles`);
    return detailedProfiles;
};

// Main function combining both steps
const scrapeLinkedInProfiles = async (searchCriteria) => {
    try {
        // Step 1: Search for profile URLs
        console.log('=== STEP 1: SEARCHING FOR PROFILE URLS ===');
        console.log('Search criteria received:', JSON.stringify(searchCriteria, null, 2));
        
        const profileUrls = await searchLinkedInProfiles(searchCriteria);
        
        if (profileUrls.length === 0) {
            console.log('No profile URLs found from search');
            return [];
        }
        
        console.log(`=== STEP 2: EXTRACTING DETAILED DATA FOR ${profileUrls.length} PROFILES ===`);
        
        // Step 2: Get detailed profile data - no timeout, let it complete
        const detailedProfiles = await getDetailedProfileData(profileUrls);
        
        // If we got some detailed profiles, use them; otherwise use basic data with real URLs
        if (detailedProfiles && detailedProfiles.length > 0) {
            console.log(`Got ${detailedProfiles.length} detailed profiles, transforming data...`);
            
            console.log('=== STEP 3: TRANSFORMING DATA ===');
            // Transform the detailed data to our expected format
            const transformedItems = detailedProfiles.map((item, index) => {
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
            
            console.log(`Successfully processed ${transformedItems.length} detailed profiles`);
            return transformedItems;
        } else {
            console.log('No detailed profile data obtained - waiting longer or returning empty');
            return [];
        }
        
    } catch (error) {
        console.error('LinkedIn profile scraping failed:', error);
        return [];
    }
};

module.exports = { scrapeLinkedInProfiles };
