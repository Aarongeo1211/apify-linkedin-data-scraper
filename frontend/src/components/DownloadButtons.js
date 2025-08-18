import React from 'react';
import { downloadExcelFile } from '../api';

const DownloadButtons = ({ data }) => {
    const handleDownloadExcel = async () => {
        try {
            await downloadExcelFile(data);
        } catch (error) {
            console.error('Error downloading Excel:', error);
            alert('Could not download Excel file.');
        }
    };

    const handleExportToExcel = async () => {
        try {
            // Create a blob URL and trigger download with specific filename
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/download/excel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data }),
            });

            if (!response.ok) {
                throw new Error('Failed to export Excel file');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.download = 'linkedin-profiles.xlsx';
            document.body.appendChild(link);
            
            // Trigger the download
            link.click();
            
            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Try to open the file (this will depend on the user's system settings)
            // Note: Modern browsers may block this for security reasons
            try {
                window.open(url, '_blank');
            } catch (e) {
                console.log('Could not auto-open Excel file, but download was successful');
            }
            
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Could not export to Excel.');
        }
    };

    return (
        <div className="download-section">
            <button onClick={handleDownloadExcel} className="download-button" style={{ marginRight: '10px' }}>
                Download as Excel
            </button>
            <button onClick={handleExportToExcel} className="export-button">
                Export to Excel
            </button>
        </div>
    );
};

export default DownloadButtons;
