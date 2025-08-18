import React, { useState } from 'react';

const SearchForm = ({ onSearch, isLoading }) => {
    const [title, setTitle] = useState('Data Scientist');
    const [location, setLocation] = useState('Canada');
    const [company, setCompany] = useState('');
    const [maxProfiles, setMaxProfiles] = useState(15);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch({ title, location, company, maxProfiles });
    };

    return (
        <div className="search-form">
            <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group">
                    <label htmlFor="title" className="form-label">Job Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                    <label htmlFor="location" className="form-label">Location</label>
                    <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                    <label htmlFor="company" className="form-label">Company</label>
                    <input type="text" id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                    <label htmlFor="maxProfiles" className="form-label">Max Profiles</label>
                    <input type="number" id="maxProfiles" value={maxProfiles} onChange={(e) => setMaxProfiles(e.target.value)} className="form-input" min="1" max="1000" />
                </div>
                <div className="form-group">
                    <button type="submit" disabled={isLoading} className="search-button">
                        {isLoading ? 'Scraping...' : 'Scrape Profiles'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SearchForm;
