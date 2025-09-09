import axios from 'axios';
import { saveAs } from 'file-saver';

const API_CLIENT = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001/api',
    timeout: 600000, // 10 minutes timeout for large chunks (100 profiles might take 8-10 minutes)
});

// Add request interceptor for debugging
API_CLIENT.interceptors.request.use(
    (config) => {
        console.log(`Frontend: Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
    },
    (error) => {
        console.error('Frontend: Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
API_CLIENT.interceptors.response.use(
    (response) => {
        console.log(`Frontend: Response received from ${response.config.url}:`, response.status);
        return response;
    },
    (error) => {
        console.error('Frontend: Response interceptor error:', error.response?.status, error.message);
        if (error.response) {
            console.error('Frontend: Error response data:', error.response.data);
        }
        return Promise.reject(error);
    }
);

// Chunked scraping for large datasets - Fixed approach
// Step 1: Get ALL profile URLs at once, Step 2: Process details in chunks
export const scrapeProfilesChunked = async (criteria, onChunkComplete, onProgress) => {
    const CHUNK_SIZE = 50; // Reduced from 100 to 50 for better timeout management
    const totalProfiles = parseInt(criteria.maxProfiles, 10);
    
    console.log(`Starting chunked processing: ${totalProfiles} profiles`);
    
    try {
        // STEP 1: Get ALL profile URLs from first actor (single call)
        if (onProgress) {
            onProgress({
                currentChunk: 0,
                totalChunks: 0,
                processedProfiles: 0,
                totalProfiles: totalProfiles,
                status: '🔍 Step 1: Searching for all profile URLs... (this may take a moment)'
            });
        }
        
        console.log('Step 1: Getting all profile URLs with single actor call');
        const searchResponse = await API_CLIENT.post('/search-urls', criteria);
        console.log('Frontend: Search response received:', searchResponse.status, searchResponse.statusText);
        const allProfileUrls = searchResponse.data || [];
        
        console.log(`Step 1 completed: Found ${allProfileUrls.length} profile URLs`);
        console.log('Frontend: Sample URLs:', allProfileUrls.slice(0, 3));
        
        if (allProfileUrls.length === 0) {
            if (onProgress) {
                onProgress({
                    currentChunk: 0,
                    totalChunks: 0,
                    processedProfiles: 0,
                    totalProfiles: 0,
                    status: '❌ No profiles found matching your criteria',
                    error: 'No profile URLs found'
                });
            }
            return [];
        }
        
        // STEP 2: Process profile details in chunks
        const actualProfileCount = Math.min(allProfileUrls.length, totalProfiles);
        const profilesToProcess = allProfileUrls.slice(0, actualProfileCount);
        const totalChunks = Math.ceil(profilesToProcess.length / CHUNK_SIZE);
        
        console.log(`Step 2: Processing ${profilesToProcess.length} profiles in ${totalChunks} chunks of ${CHUNK_SIZE}`);
        
        if (onProgress) {
            onProgress({
                currentChunk: 0,
                totalChunks: totalChunks,
                processedProfiles: 0,
                totalProfiles: profilesToProcess.length,
                status: `✅ Found ${profilesToProcess.length} profiles. Starting detailed extraction in ${totalChunks} chunks of ${CHUNK_SIZE}...`
            });
        }
        
        let allResults = [];
        
        // Process URLs in chunks for detailed extraction
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const startIdx = chunkIndex * CHUNK_SIZE;
            const endIdx = Math.min(startIdx + CHUNK_SIZE, profilesToProcess.length);
            const chunkUrls = profilesToProcess.slice(startIdx, endIdx);
            
            console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks}: URLs ${startIdx + 1}-${endIdx}`);
            
            try {
                // Update progress before processing chunk
                if (onProgress) {
                    onProgress({
                        currentChunk: chunkIndex + 1,
                        totalChunks: totalChunks,
                        processedProfiles: allResults.length,
                        totalProfiles: profilesToProcess.length,
                        status: `⚡ Processing detailed data for chunk ${chunkIndex + 1}/${totalChunks}...`
                    });
                }
                
                // Call backend to process this chunk of URLs for detailed extraction
                console.log(`Frontend: Sending ${chunkUrls.length} URLs to /scrape-details`);
                const chunkResponse = await API_CLIENT.post('/scrape-details', {
                    profileUrls: chunkUrls
                });
                console.log(`Frontend: Chunk response received:`, chunkResponse.status, chunkResponse.statusText);
                const chunkResults = chunkResponse.data || [];
                
                console.log(`Chunk ${chunkIndex + 1} completed: ${chunkResults.length} profiles processed`);
                console.log('Frontend: Sample chunk results:', chunkResults.slice(0, 2));
                
                // Add chunk results to total results
                allResults = [...allResults, ...chunkResults];
                
                // Call the chunk completion callback with new results
                if (onChunkComplete) {
                    onChunkComplete(chunkResults, {
                        chunkIndex: chunkIndex + 1,
                        totalChunks: totalChunks,
                        allResults: allResults,
                        processedProfiles: allResults.length,
                        totalProfiles: profilesToProcess.length
                    });
                }
                
                // Update progress after chunk completion
                if (onProgress) {
                    onProgress({
                        currentChunk: chunkIndex + 1,
                        totalChunks: totalChunks,
                        processedProfiles: allResults.length,
                        totalProfiles: profilesToProcess.length,
                        status: `✅ Completed chunk ${chunkIndex + 1}/${totalChunks}. ${allResults.length}/${profilesToProcess.length} profiles processed.`
                    });
                }
                
                // Add small delay between chunks to be respectful
                if (chunkIndex < totalChunks - 1) {
                    console.log('Waiting 2 seconds before next chunk...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (error) {
                console.error(`Error processing chunk ${chunkIndex + 1}:`, error);
                
                let errorMessage = error.message;
                if (error.code === 'ECONNABORTED') {
                    errorMessage = `Chunk ${chunkIndex + 1} timed out after 10 minutes. This chunk had ${chunkUrls.length} profiles.`;
                }
                
                // Update progress with error status
                if (onProgress) {
                    onProgress({
                        currentChunk: chunkIndex + 1,
                        totalChunks: totalChunks,
                        processedProfiles: allResults.length,
                        totalProfiles: profilesToProcess.length,
                        status: `⚠️ Error in chunk ${chunkIndex + 1}/${totalChunks}: ${errorMessage}. Continuing with next chunk...`,
                        error: errorMessage
                    });
                }
                
                // Continue with next chunk instead of failing completely
                continue;
            }
        }
        
        console.log(`Chunked processing completed: ${allResults.length} total profiles`);
        return allResults;
        
    } catch (error) {
        console.error('Error in chunked processing:', error);
        if (onProgress) {
            onProgress({
                currentChunk: 0,
                totalChunks: 0,
                processedProfiles: 0,
                totalProfiles: 0,
                status: '❌ Error during processing',
                error: error.message
            });
        }
        throw error;
    }
};

// Original single request function (kept for backward compatibility)
export const scrapeProfiles = (criteria) => {
    // For small datasets, use original approach
    const maxProfiles = parseInt(criteria.maxProfiles, 10);
    if (maxProfiles <= 100) {
        return API_CLIENT.post('/scrape', criteria);
    } else {
        // For large datasets, suggest using chunked approach
        console.warn('Large dataset detected. Consider using scrapeProfilesChunked for better performance.');
        return API_CLIENT.post('/scrape', criteria);
    }
};

export const downloadExcelFile = async (data) => {
    try {
        console.log('API: Starting Excel download request with', data.length, 'profiles');
        console.log('API: Sample profile data:', data.slice(0, 1));
        
        const response = await API_CLIENT.post('/download/excel', { data }, { 
            responseType: 'blob',
            timeout: 30000 // 30 seconds timeout for Excel generation
        });
        
        console.log('API: Excel file generated successfully, size:', response.data.size, 'bytes');
        
        // Check if the response is actually a blob
        if (!(response.data instanceof Blob)) {
            throw new Error('Invalid response format: expected blob');
        }
        
        // Use file-saver to download the file
        saveAs(new Blob([response.data]), 'linkedin-profiles.xlsx');
        console.log('API: Excel file download triggered successfully');
        
    } catch (error) {
        console.error('API: Excel download failed:', error);
        if (error.response?.data instanceof Blob) {
            // Try to read the error message from blob
            const text = await error.response.data.text();
            console.error('API: Server error message:', text);
        }
        throw error;
    }
};

export const downloadPdfFile = async (profile) => {
    const response = await API_CLIENT.post('/download/pdf', { profile }, { responseType: 'blob' });
    const fileName = (profile.fullName || 'profile').replace(/\s+/g, '_');
    saveAs(new Blob([response.data]), `${fileName}.pdf`);
};

export const syncToCeipal = (profile) => {
    return API_CLIENT.post('/ceipal/sync', { profile });
};
