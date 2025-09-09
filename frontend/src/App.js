import React, { useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import DownloadButtons from './components/DownloadButtons';
import { scrapeProfiles, scrapeProfilesChunked } from './api';
import './App.css';

function App() {
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(null);
    const [processingStats, setProcessingStats] = useState(null);

    const handleSearch = async (criteria) => {
        const maxProfiles = parseInt(criteria.maxProfiles, 10);
        
        setIsLoading(true);
        setError('');
        setResults([]);
        setProgress(null);
        setProcessingStats(null);
        
        try {
            console.log(`Starting scrape for ${maxProfiles} profiles...`);
            
            // Use chunked processing for large datasets
            if (maxProfiles > 100) {
                console.log('Using chunked processing for large dataset');
                
                const startTime = Date.now();
                
                try {
                    const finalResults = await scrapeProfilesChunked(
                        criteria,
                        // onChunkComplete callback - called when each chunk finishes
                        (chunkResults, chunkInfo) => {
                            console.log(`Frontend: Chunk ${chunkInfo.chunkIndex} completed:`, chunkResults.length, 'profiles');
                            console.log('Frontend: Chunk results:', chunkResults);
                            
                            // Add new results to existing results in real-time
                            setResults(prevResults => {
                                const newResults = [...prevResults, ...chunkResults];
                                console.log(`Frontend: Total results now: ${newResults.length}`);
                                console.log('Frontend: Sample of new results:', newResults.slice(0, 2));
                                return newResults;
                            });
                            
                            // Update processing stats
                            const elapsedTime = (Date.now() - startTime) / 1000;
                            const profilesPerSecond = chunkInfo.processedProfiles / elapsedTime;
                            const estimatedTimeRemaining = (chunkInfo.totalProfiles - chunkInfo.processedProfiles) / profilesPerSecond;
                            
                            setProcessingStats({
                                processedProfiles: chunkInfo.processedProfiles,
                                totalProfiles: chunkInfo.totalProfiles,
                                currentChunk: chunkInfo.chunkIndex,
                                totalChunks: chunkInfo.totalChunks,
                                elapsedTime: elapsedTime,
                                profilesPerSecond: profilesPerSecond.toFixed(2),
                                estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining.toFixed(0) : 0
                            });
                        },
                        // onProgress callback - called during chunk processing
                        (progressInfo) => {
                            console.log('Frontend: Progress update:', progressInfo.status);
                            setProgress(progressInfo);
                        }
                    );
                    
                    console.log(`Frontend: Chunked processing completed: ${finalResults?.length || 0} total profiles`);
                    console.log('Frontend: Final results sample:', finalResults?.slice(0, 2));
                    
                    // Ensure final results are set
                    if (finalResults && finalResults.length > 0) {
                        setResults(finalResults);
                        setProgress({
                            currentChunk: processingStats?.totalChunks || 1,
                            totalChunks: processingStats?.totalChunks || 1,
                            processedProfiles: finalResults.length,
                            totalProfiles: maxProfiles,
                            status: `✅ Processing completed! ${finalResults.length} profiles scraped successfully.`
                        });
                    } else {
                        console.warn('Frontend: No final results received from chunked processing');
                        setError('No results received from the backend. Check the backend console for errors.');
                    }
                    
                } catch (chunkError) {
                    console.error('Frontend: Error in chunked processing:', chunkError);
                    setError(`Chunked processing failed: ${chunkError.message}. Check the backend console for detailed errors.`);
                }
                
            } else {
                // Use original single request for small datasets
                console.log('Using single request for small dataset');
                const response = await scrapeProfiles(criteria);
                setResults(response.data);
                console.log(`Successfully scraped ${response.data.length} profiles`);
            }
            
        } catch (err) {
            console.error('Scraping error:', err);
            
            if (err.code === 'ECONNABORTED') {
                setError(`Request timed out while processing ${maxProfiles} profiles. Try using a smaller chunk size or check your network connection.`);
            } else if (err.response?.status === 500) {
                setError(`Server error occurred while processing ${maxProfiles} profiles. Check the backend console for detailed error information.`);
            } else if (!err.response) {
                setError(`Network error: Unable to connect to the backend. Ensure the backend is running on the correct port.`);
            } else {
                setError(`Failed to fetch data (${err.response?.status || 'Unknown error'}). ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">LinkedIn Scraper</h1>
                <p className="app-subtitle">Built with Apify, React, and Node.js</p>
            </header>

            <SearchForm onSearch={handleSearch} isLoading={isLoading} />

            {error && <p className="error-message">{error}</p>}
            
            {/* Progress indicator for chunked processing */}
            {isLoading && progress && (
                <div className="progress-container">
                    <div className="progress-header">
                        <h3>🔄 Processing Progress</h3>
                    </div>
                    <div className="progress-info">
                        <p><strong>Status:</strong> {progress.status}</p>
                        <p><strong>Chunk Progress:</strong> {progress.currentChunk}/{progress.totalChunks}</p>
                        <p><strong>Profiles:</strong> {progress.processedProfiles}/{progress.totalProfiles}</p>
                        {progress.error && (
                            <p className="error-text"><strong>Warning:</strong> {progress.error}</p>
                        )}
                    </div>
                    
                    {/* Progress bar */}
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ 
                                width: `${(progress.processedProfiles / progress.totalProfiles) * 100}%` 
                            }}
                        ></div>
                    </div>
                    <p className="progress-percentage">
                        {Math.round((progress.processedProfiles / progress.totalProfiles) * 100)}% Complete
                    </p>
                    
                    {/* Processing stats */}
                    {processingStats && (
                        <div className="processing-stats">
                            <p><strong>⏱️ Elapsed Time:</strong> {Math.round(processingStats.elapsedTime)}s</p>
                            <p><strong>⚡ Speed:</strong> {processingStats.profilesPerSecond} profiles/sec</p>
                            {processingStats.estimatedTimeRemaining > 0 && (
                                <p><strong>🕐 Est. Time Remaining:</strong> {processingStats.estimatedTimeRemaining}s</p>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {/* Results section - shows results in real-time */}
            {results.length > 0 && (
                <div className="results-section">
                    <div className="results-header">
                        <h3>📊 Results ({results.length} profiles)</h3>
                        {isLoading && (
                            <p className="live-update-indicator">🔴 Live updates - new results will appear automatically</p>
                        )}
                    </div>
                    <DownloadButtons data={results} />
                    <ResultsTable data={results} />
                </div>
            )}
            
            {/* Loading indicator for initial load or small datasets */}
            {isLoading && !progress && (
                 <div className="loading-container">
                    <p className="loading-text">🔍 Initializing scraping process... this may take a moment.</p>
                </div>
            )}
        </div>
    );
}

export default App;
