const Excel = require('exceljs');

const generateExcel = async (data) => {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('LinkedIn Profiles');

    worksheet.columns = [
        { header: 'Salutation', key: 'salutation', width: 15 },
        { header: 'First Name', key: 'firstName', width: 20 },
        { header: 'Middle Name', key: 'middleName', width: 15 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Nick Name', key: 'nickName', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Email Address1', key: 'emailAddress1', width: 30 },
        { header: 'Mobile Number', key: 'mobileNumber', width: 20 },
        { header: 'Home Phone Number', key: 'homePhoneNumber', width: 20 },
        { header: 'Other Phone', key: 'otherPhone', width: 20 },
        { header: 'Work Phone Number', key: 'workPhoneNumber', width: 20 },
        { header: 'Clearence', key: 'clearence', width: 15 },
        { header: 'Clearence Type', key: 'clearenceType', width: 15 },
        { header: 'Work Authorization', key: 'workAuthorization', width: 20 },
        { header: 'Work Authorization Expiry', key: 'workAuthorizationExpiry', width: 25 },
        { header: 'Linked In', key: 'linkedIn', width: 40 },
        { header: 'Video Reference', key: 'videoReference', width: 20 },
        { header: 'Skype ID', key: 'skypeId', width: 20 },
        { header: 'Job Title', key: 'jobTitle', width: 40 },
        { header: 'Postal Code', key: 'postalCode', width: 15 },
        { header: 'Address', key: 'address', width: 40 },
        { header: 'Country', key: 'country', width: 20 },
        { header: 'State', key: 'state', width: 20 },
        { header: 'City', key: 'city', width: 20 },
        { header: 'Source', key: 'source', width: 20 },
        { header: 'Experience', key: 'experience', width: 50 },
        { header: 'Experience in Months', key: 'experienceInMonths', width: 20 },
        { header: 'Ownership', key: 'ownership', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Created By', key: 'createdBy', width: 20 },
        { header: 'Primary Skills', key: 'primarySkills', width: 40 },
        { header: 'Additional Comments', key: 'additionalComments', width: 50 },
        { header: 'Resume', key: 'resume', width: 20 },
        { header: 'Passport', key: 'passport', width: 20 },
        { header: 'Current Company', key: 'currentCompany', width: 30 },
        { header: 'Current CTC', key: 'currentCTC', width: 15 },
        { header: 'Expected Pay', key: 'expectedPay', width: 15 },
        { header: 'Notice Period', key: 'noticePeriod', width: 15 },
        { header: 'Notice Serving Date', key: 'noticeServingDate', width: 20 },
        { header: 'Pan Card Number', key: 'panCardNumber', width: 20 },
        { header: 'Race/Ethnicity', key: 'raceEthnicity', width: 15 },
        { header: 'Tax Terms', key: 'taxTerms', width: 15 },
        { header: 'Referred By', key: 'referredBy', width: 20 },
        { header: 'Twitter Profile Url', key: 'twitterProfileUrl', width: 40 },
        { header: 'Facebook Profile Url', key: 'facebookProfileUrl', width: 40 },
        { header: 'LinkedIn Profile URL', key: 'linkedInProfileUrl', width: 40 },
        { header: 'Applicant Group', key: 'applicantGroup', width: 20 },
        { header: 'custom Applicant Status', key: 'customApplicantStatus', width: 25 },
        { header: 'Skills', key: 'skills', width: 40 },
        { header: 'Function', key: 'function', width: 20 },
        { header: 'SSN', key: 'ssn', width: 15 },
        { header: 'Date Of Birth', key: 'dateOfBirth', width: 20 },
        { header: 'GPA', key: 'gpa', width: 10 },
        { header: 'Notes', key: 'notes', width: 50 },
        { header: 'Relocation', key: 'relocation', width: 15 },
        { header: 'Gender', key: 'gender', width: 15 },
        { header: 'Disability', key: 'disability', width: 15 },
        { header: 'Technology', key: 'technology', width: 25 },
        { header: 'Industry', key: 'industry', width: 25 },
        { header: 'Veteran Status', key: 'veteranStatus', width: 15 },
        { header: 'Veteran Type', key: 'veteranType', width: 15 },
    ];

    // Add header styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
    };

    const processedData = data.map(item => {
        const nameParts = item.fullName ? item.fullName.split(' ') : [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        const locationParts = item.location ? item.location.split(',').map(part => part.trim()) : [];
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || '';

        return {
            salutation: '',
            firstName: firstName,
            middleName: '',
            lastName: lastName,
            nickName: '',
            email: item.email || '',
            emailAddress1: '',
            mobileNumber: item.phone || '',
            homePhoneNumber: '',
            otherPhone: '',
            workPhoneNumber: '',
            clearence: '',
            clearenceType: '',
            workAuthorization: '',
            workAuthorizationExpiry: '',
            linkedIn: item.profileUrl || '',
            videoReference: '',
            skypeId: '',
            jobTitle: item.title || '',
            postalCode: '',
            address: '',
            country: country,
            state: state,
            city: city,
            source: 'LinkedIn',
            experience: item.experience || '',
            experienceInMonths: item.experienceInMonths || '',
            ownership: '',
            status: '',
            createdBy: '',
            primarySkills: item.skills || '',
            additionalComments: '',
            resume: '',
            passport: '',
            currentCompany: item.company || '',
            currentCTC: '',
            expectedPay: '',
            noticePeriod: '',
            noticeServingDate: '',
            panCardNumber: '',
            raceEthnicity: '',
            taxTerms: '',
            referredBy: '',
            twitterProfileUrl: '',
            facebookProfileUrl: '',
            linkedInProfileUrl: item.profileUrl || '',
            applicantGroup: '',
            customApplicantStatus: '',
            skills: item.skills || '',
            'function': '',
            ssn: '',
            dateOfBirth: '',
            gpa: '',
            notes: item.summary || '',
            relocation: '',
            gender: '',
            disability: '',
            technology: '',
            industry: item.industry || '',
            veteranStatus: '',
            veteranType: '',
        };
    });

    worksheet.addRows(processedData);
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
        column.alignment = { vertical: 'top', wrapText: true };
    });

    return await workbook.xlsx.writeBuffer();
};

module.exports = { generateExcel };
