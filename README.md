# LinkedIn Jobs Scraper

A full-stack application that scrapes LinkedIn for people with specific job titles and locations, providing comprehensive profile data including contact information.

## 🚀 Features

### Enhanced Two-Step Scraping Process
- **Step 1**: Search for LinkedIn profiles by job title and location using `harvestapi/linkedin-profile-search`
- **Step 2**: Extract detailed profile information using `apimaestro/linkedin-profile-detail`
- **Fallback**: Alternative actor `logical_scrapers/linkedin-profile-scraper` for additional reliability

### Comprehensive Profile Data
- **Basic Information**: Full name, current job title, company, location
- **Contact Details**: Email addresses, phone numbers, websites, social media links
- **Professional Background**: Work experience, education, skills, industry
- **Social Metrics**: Connection count, years of experience
- **Profile Access**: Direct LinkedIn profile URLs

### Modern Frontend
- Clean, responsive React interface
- Real-time search with loading indicators
- Sortable data tables with comprehensive information
- Custom CSS styling (no Tailwind dependencies)

### Data Export Options
- **Excel Export**: Download as .xlsx files with all profile data
- **PDF Export**: Professional formatted PDF reports
- Both options include complete contact and professional information

## 🛠 Technology Stack

### Backend
- **Node.js & Express**: RESTful API server
- **Apify Integration**: Multiple actors for robust data collection
- **ExcelJS**: Excel file generation
- **PDFKit**: PDF document creation
- **CORS**: Cross-origin resource sharing

### Frontend
- **React**: Modern UI framework
- **Custom CSS**: Responsive design without external CSS frameworks
- **Axios**: HTTP client for API communication

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Apify account with API token

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
APIFY_API_TOKEN="your_apify_api_token_here"
APIFY_SEARCH_ACTOR_ID="harvestapi/linkedin-profile-search"
APIFY_DETAIL_ACTOR_ID="apimaestro/linkedin-profile-detail"
APIFY_FALLBACK_ACTOR_ID="logical_scrapers/linkedin-profile-scraper"
```

Start the backend server:
```bash
npm start
```
Server will run on http://localhost:5001

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
Application will open at http://localhost:3000

## 🔧 Configuration

### Apify Actors Configuration

#### Primary Search Actor (`harvestapi/linkedin-profile-search`)
- **Purpose**: Find LinkedIn profile URLs based on job title and location
- **Mode**: Basic mode for profile discovery
- **Input**: Job titles, locations, maximum profiles count
- **Output**: LinkedIn profile URLs

#### Detail Actor (`apimaestro/linkedin-profile-detail`)
- **Purpose**: Extract comprehensive profile data including contact information
- **Features**: No cookies required, includes email extraction
- **Input**: LinkedIn profile usernames/URLs
- **Output**: Detailed profile information with contact data

#### Fallback Actor (`logical_scrapers/linkedin-profile-scraper`)
- **Purpose**: Alternative scraper for additional reliability
- **Features**: Comprehensive profile data extraction
- **Input**: LinkedIn profile URLs
- **Output**: Detailed profile information

### Proxy Settings
All actors are configured to use Apify's residential proxy groups for reliable scraping and IP rotation.

## 📊 Data Fields

The application extracts and displays the following information:

| Field | Description | Source |
|-------|-------------|---------|
| Full Name | Complete name | Profile header |
| Title | Current job title | Current position |
| Company | Current employer | Current position |
| Location | Geographic location | Profile location |
| Summary | Professional summary | About section |
| Experience | Work history summary | Experience section |
| Contact Details | Email, phone, website | Contact information |
| Email | Direct email address | Contact info |
| Phone | Phone number | Contact info |
| Skills | Top professional skills | Skills section |
| Education | Educational background | Education section |
| Connections | Network size | Profile metrics |
| Industry | Professional industry | Profile details |
| Years of Experience | Career duration | Calculated from experience |

## 🔍 Usage

1. **Enter Search Criteria**:
   - Job Title (e.g., "Data Scientist", "Software Engineer")
   - Location (e.g., "Canada", "San Francisco", "London")
   - Max Profiles (1-50, default: 10)

2. **Search Profiles**:
   - Click "Search LinkedIn Profiles"
   - View real-time progress and results

3. **Review Results**:
   - Sortable table with all profile information
   - Click column headers to sort
   - View contact details and professional information

4. **Export Data**:
   - **Download as Excel**: Complete spreadsheet with all fields
   - **Export to PDF**: Professional formatted report

## 🔒 Privacy & Compliance

### Legal Considerations
- Only scrapes publicly available LinkedIn information
- Respects LinkedIn's robots.txt and rate limiting
- Uses ethical scraping practices with delays between requests
- No account credentials required (cookieless scraping)

### Data Handling
- No data is stored permanently on servers
- Contact information is handled securely
- Export files are generated client-side
- Complies with data privacy regulations

### Rate Limiting
- Batch processing with delays between requests
- Reduced concurrent requests to avoid overloading
- Automatic retry mechanisms with fallback actors

## 🐛 Troubleshooting

### Common Issues

#### "No profiles found"
- Verify job title and location are specific enough
- Try broader search terms
- Check if the location exists on LinkedIn

#### "Search failed"
- Verify Apify API token is correct and active
- Check if actors are available and properly configured
- Review backend logs for detailed error messages

#### "Contact information missing"
- Not all profiles have publicly available contact details
- Some profiles may have privacy settings enabled
- Try different actors if one fails to extract contact info

#### Backend Connection Issues
- Ensure backend server is running on port 5001
- Check firewall settings
- Verify CORS configuration

## 📈 Performance Optimization

### Batch Processing
- Profiles are processed in small batches (2 at a time)
- 3-second delays between batches for stability
- Parallel processing within batches for efficiency

### Fallback Mechanisms
- Multiple actor options for reliability
- Automatic retry with different actors
- Sample data fallback for demonstration

### Memory Management
- Efficient data transformation
- Minimal memory footprint
- Optimized for handling 10-50 profiles per search

## 🔄 API Endpoints

### POST /api/search
Search for LinkedIn profiles

**Request Body:**
```json
{
  "title": "Data Scientist",
  "location": "Canada",
  "maxProfiles": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "fullName": "John Doe",
      "title": "Data Scientist",
      "company": "Tech Corp",
      "location": "Toronto, Canada",
      "email": "john.doe@techcorp.com",
      "phone": "+1-416-555-0123",
      "profileUrl": "https://linkedin.com/in/johndoe",
      "summary": "Experienced data scientist with...",
      "experience": "5+ years",
      "skills": "Python, Machine Learning, SQL",
      "education": "University of Toronto",
      "industry": "Technology",
      "connections": "500+",
      "contactDetails": "Email: john.doe@techcorp.com | Phone: +1-416-555-0123"
    }
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is for educational and research purposes. Please ensure compliance with LinkedIn's Terms of Service and applicable data protection regulations.

## 🔗 Resources

- [Apify Documentation](https://docs.apify.com/)
- [LinkedIn Profile Search Actor](https://apify.com/harvestapi/linkedin-profile-search)
- [LinkedIn Profile Detail Actor](https://apify.com/apimaestro/linkedin-profile-detail)
- [React Documentation](https://reactjs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)

---

**Note**: This tool is designed for legitimate business purposes such as recruitment, lead generation, and market research. Always ensure compliance with LinkedIn's Terms of Service and applicable privacy laws when using this application.
