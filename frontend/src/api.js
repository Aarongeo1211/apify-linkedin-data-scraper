import axios from 'axios';
import { saveAs } from 'file-saver';

const API_CLIENT = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL,
});

export const scrapeProfiles = (criteria) => {
    return API_CLIENT.post('/scrape', criteria);
};

export const downloadExcelFile = async (data) => {
    const response = await API_CLIENT.post('/download/excel', { data }, { responseType: 'blob' });
    saveAs(new Blob([response.data]), 'linkedin-profiles.xlsx');
};

export const downloadPdfFile = async (profile) => {
    const response = await API_CLIENT.post('/download/pdf', { profile }, { responseType: 'blob' });
    const fileName = (profile.fullName || 'profile').replace(/\s+/g, '_');
    saveAs(new Blob([response.data]), `${fileName}.pdf`);
};

export const syncToCeipal = (profile) => {
    return API_CLIENT.post('/ceipal/sync', { profile });
};
