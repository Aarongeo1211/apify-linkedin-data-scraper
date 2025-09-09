import React, { useState } from 'react';
import { downloadExcelFile } from '../api';

const DownloadButtons = ({ data }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    
    const handleDownloadExcel = async () => {
        if (!data || data.length === 0) {
            alert('No data available to download. Please scrape some profiles first.');
            return;
        }
        
        setIsDownloading(true);
        try {
            console.log('Starting Excel download for', data.length, 'profiles');
            console.log('Sample data:', data.slice(0, 2));
            
            await downloadExcelFile(data);
            console.log('Excel download completed successfully');
            
        } catch (error) {
            console.error('Error downloading Excel:', error);
            
            let errorMessage = 'Could not download Excel file.';
            if (error.response?.status === 500) {
                errorMessage = 'Server error while generating Excel file. Check backend console.';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Download request timed out. Try again.';
            } else if (!error.response) {
                errorMessage = 'Network error: Could not connect to server.';
            }
            
            alert(errorMessage);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="download-section">
            <button 
                onClick={handleDownloadExcel} 
                className="download-button" 
                disabled={isDownloading || !data || data.length === 0}
                style={{ marginRight: '10px' }}
            >
                {isDownloading ? 'Downloading...' : `Download Excel (${data?.length || 0} profiles)`}
            </button>
        </div>
    );
};

export default DownloadButtons;
