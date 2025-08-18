const PDFDocument = require('pdfkit');

const generatePdf = (data) => {
    console.log('Generating PDF with data:', JSON.stringify(data, null, 2));
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => {
                console.error('PDF generation error:', err);
                reject(err);
            });

            const profiles = Array.isArray(data) ? data : [data];

            profiles.forEach(profile => {
                // Helper function to add a section with a title and content
                const addSection = (title, content) => {
                    if (content && content !== 'N/A' && content !== '') {
                        doc.fontSize(16).fillColor('black').font('Helvetica-Bold').text(title);
                        doc.moveDown(0.5);
                        doc.fontSize(12).font('Helvetica').text(content);
                        doc.moveDown(1);
                    }
                };

                // Helper function to add a key-value pair
                const addDetail = (key, value) => {
                    if (value && value !== 'N/A' && value !== '') {
                        doc.fontSize(12).font('Helvetica-Bold').text(key, { continued: true });
                        doc.font('Helvetica').text(`: ${value}`);
                        doc.moveDown(0.3);
                    }
                };

                // Header with name and title
                doc.fontSize(24).font('Helvetica-Bold').text(profile.fullName || 'N/A', { align: 'center' });
                doc.moveDown(0.5);
                doc.fontSize(16).font('Helvetica').text(profile.title || 'N/A', { align: 'center' });
                doc.moveDown(1);

                // Personal Information
                doc.fontSize(18).font('Helvetica-Bold').text('Personal Information');
                doc.moveDown(0.5);
                addDetail('First Name', profile.firstName);
                addDetail('Last Name', profile.lastName);
                addDetail('Email', profile.email || 'Not Available');
                addDetail('Phone', profile.phone);
                addDetail('Location', profile.location);
                addDetail('Country', profile.country);
                addDetail('State', profile.state);
                addDetail('City', profile.city);
                addDetail('Postal Code', profile.postalCode);
                addDetail('Address', profile.address);
                doc.moveDown(1);

                // Professional Summary
                addSection('Professional Summary', profile.summary);

                // Work Experience
                addSection('Work Experience', profile.experience);

                // Skills
                addSection('Skills', profile.skills);

                // Education
                addSection('Education', profile.education);

                // Additional Information
                doc.fontSize(18).font('Helvetica-Bold').text('Additional Information');
                doc.moveDown(0.5);
                addDetail('LinkedIn', profile.profileUrl, { link: profile.profileUrl, underline: true, color: 'blue' });
                addDetail('Current Company', profile.company);
                addDetail('Industry', profile.industry);
                addDetail('Years of Experience', profile.yearsOfExperience);
                addDetail('Connections', profile.connections);
                addDetail('Source', profile.source);
                addDetail('Work Authorization', profile.workAuthorization);
                addDetail('Notice Period', profile.noticePeriod);
                doc.moveDown(1);

                if (profiles.indexOf(profile) < profiles.length - 1) {
                    doc.addPage();
                }
            });

            doc.end();
        } catch (error) {
            console.error('Error in generatePdf function:', error);
            reject(error);
        }
    });
};

module.exports = { generatePdf };