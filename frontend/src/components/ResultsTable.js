import React from 'react';
import { downloadPdfFile, syncToCeipal } from '../api';

const ResultsTable = ({ data }) => {
    const handleDownloadPdf = async (profile) => {
        try {
            await downloadPdfFile(profile);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Could not download PDF.');
        }
    };

    const handleSyncToCeipal = async (profile) => {
        try {
            await syncToCeipal(profile);
            alert('Successfully synced profile to Ceipal!');
        } catch (error) {
            console.error('Error syncing to Ceipal:', error);
            alert('Could not sync profile to Ceipal.');
        }
    };

    return (
        <div className="table-container">
            <table className="results-table">
                <thead className="table-header">
                    <tr>
                        <th>Name</th>
                        <th>Title</th>
                        <th>Company</th>
                        <th>Location</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Experience</th>
                        <th>Industry</th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="table-body">
                    {data.map((profile, index) => (
                        <tr key={index}>
                            <td className="font-medium">{profile.fullName || 'N/A'}</td>
                            <td className="text-gray">{profile.title || 'N/A'}</td>
                            <td className="text-gray">{profile.company || 'N/A'}</td>
                            <td className="text-gray">{profile.location || 'N/A'}</td>
                            <td className="text-gray">{profile.email || 'N/A'}</td>
                            <td className="text-gray">{profile.phone || 'N/A'}</td>
                            <td className="text-gray">{profile.experience || 'N/A'}</td>
                            <td className="text-gray">{profile.industry || 'N/A'}</td>
                            <td className="text-center">
                                <button onClick={() => handleDownloadPdf(profile)} className="action-button">PDF</button>
                                <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer" className="action-link">LinkedIn</a>
                                <button onClick={() => handleSyncToCeipal(profile)} className="action-button">Sync to Ceipal</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResultsTable;
