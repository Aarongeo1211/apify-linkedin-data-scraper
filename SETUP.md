# LinkedIn Scraper Setup Instructions

## Quick Start

1. **Configure Environment Variables**
   - Edit `backend/.env` and add your Apify credentials:
     ```
     APIFY_API_TOKEN="your_actual_token_here"
     APIFY_ACTOR_ID="your_actual_actor_id_here"
     ```

2. **Run the Application**
   
   **Option A: Using the startup scripts**
   ```bash
   # Double-click start.bat (Windows)
   # Or run: .\start.ps1 (PowerShell)
   ```
   
   **Option B: Manual startup**
   ```bash
   # Terminal 1 - Backend
   cd backend
   node src/server.js
   
   # Terminal 2 - Frontend  
   cd frontend
   npm start
   ```
   
   **Option C: Using VS Code Tasks**
   - Press `Ctrl+Shift+P`
   - Type "Tasks: Run Task"
   - Select "Start Full Application"

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Project Structure

```
linkedin-jobs-scraper/
├── backend/           # Node.js/Express API server
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── utils/     # Utility functions (Apify, Excel, PDF)
│   │   └── server.js  # Main server file
│   ├── .env          # Environment variables (add your Apify credentials)
│   └── package.json  # Backend dependencies
│
├── frontend/         # React frontend application
│   ├── src/
│   │   ├── components/# React components
│   │   ├── styles/   # CSS/Tailwind styles
│   │   ├── api.js    # API client functions
│   │   └── App.js    # Main React component
│   ├── .env         # Frontend environment variables
│   └── package.json # Frontend dependencies
│
├── start.bat        # Windows startup script
├── start.ps1        # PowerShell startup script
└── README.md        # Project documentation
```

## Features

- 🔍 **Search LinkedIn Profiles**: Search by job title, location, and number of profiles
- 📊 **View Results**: Clean table view of all scraped profile data
- 📄 **Export to Excel**: Download all results as a spreadsheet
- 📋 **Individual PDFs**: Generate PDF reports for specific profiles
- 🌐 **Direct LinkedIn Links**: Quick access to original LinkedIn profiles

## Next Steps

1. **Test the Application**: Try searching for "Data Scientist" in "Canada"
2. **Customize Fields**: Modify the Excel/PDF generators to match your Apify actor's output
3. **ATS Integration**: Follow the README.md guide to connect with your Application Tracking System

## Troubleshooting

- **Backend won't start**: Check that your Apify credentials are correct in `backend/.env`
- **Frontend build errors**: Make sure all dependencies are installed with `npm install`
- **No search results**: Verify your Apify Actor ID is correct and the actor is configured properly
- **CORS errors**: Ensure both servers are running on the correct ports (5001 for backend, 3000 for frontend)
