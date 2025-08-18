import React, { useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import DownloadButtons from './components/DownloadButtons';
import { scrapeProfiles } from './api';
import './App.css';

function App() {
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (criteria) => {
        setIsLoading(true);
        setError('');
        setResults([]);
        try {
            const response = await scrapeProfiles(criteria);
            setResults(response.data);
        } catch (err) {
            setError('Failed to fetch data. Ensure the backend is running and check its console for errors.');
        }
        setIsLoading(false);
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">LinkedIn Scraper</h1>
                <p className="app-subtitle">Built with Apify, React, and Node.js</p>
            </header>

            <SearchForm onSearch={handleSearch} isLoading={isLoading} />

            {error && <p className="error-message">{error}</p>}
            
            {results.length > 0 && !isLoading && (
                <div className="results-section">
                    <DownloadButtons data={results} />
                    <ResultsTable data={results} />
                </div>
            )}
            
            {isLoading && (
                 <div className="loading-container">
                    <p className="loading-text">Scraping profiles... this may take a moment.</p>
                </div>
            )}
        </div>
    );
}

export default App;
