# UMacro Tracker

A comprehensive macro tracking application for the UMass dining halls!! This app provides real-time nutritional information through web scraping.

## Features

- **Real Nutrition Data**: Live nutritional information scraped directly from the UMass dining website
- **Comprehensive Coverage**: All main dining commons and campus center eateries, including Blue Wall (babyBerk WIP)
- **Accurate Macros**: Calories, protein, carbs, fat, and detailed nutrition facts as seen on the menus
- **User Authentication**: Secure login and registration system
- **Meal Logging**: Track your daily food intake with portion size adjustments
- **Dashboard**: Visual macro tracking and meal history
- **Responsive Design**: Modern UI built with React and Tailwind CSS

## Nutrition Data Sources

### Main Dining Commons
- Berkshire Dining Commons
- Franklin Dining Commons  
- Worcester Dining Commons
- Hampshire Dining Commons

### Campus Center Eateries
- People's Organic Coffee
- Harvest Market

### Blue Wall
- Tavola
- Yum! Bakery
- Green Fields
- Tamales
- Wasabi
- Deli Delish
- Star Ginger
- The Grill

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB**: NoSQL database for user data and meal logs
- **Web Scraping**: BeautifulSoup4 for extracting nutrition data
- **Authentication**: JWT-based security with bcrypt password hashing

### Frontend
- **React 19**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components
- **Responsive Design**: Mobile-first approach

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or cloud)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Configuration

### Backend Environment Variables
Create a `.env` file in the `backend` directory:
```env
MONGO_URL=your-mongodb-url
DB_NAME=your-db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=your-port
```

### Frontend Environment Variables
Create a `.env` file in the `frontend` directory:
```env
REACT_APP_BACKEND_URL=your-port
```

## Running the Application

### Start Backend
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port [your-backend-port]
```

### Start Frontend
```bash
cd frontend
npm start
```

## Nutrition Scraping System

The app uses a web scraping system to extract real nutritional data from UMass dining websites:

### How It Works
1. **HTML Parsing**: Multiple strategies for different website layouts
2. **Data Extraction**: Pattern matching for nutrition values
3. **Fallback System**: Estimation algorithm when scraping fails (based on similar menu items)
4. **Rate Limiting**: Respectful scraping with delays

### API Endpoints
- `GET /api/nutrition/scrape/{location}` - Scrape specific location
- `GET /api/nutrition/search` - Search for food nutrition
- `GET /api/nutrition/locations` - Get available locations
- `POST /api/nutrition/scrape-all` - Scrape all locations

### Testing the Scraper
```bash
cd backend
python test_nutrition_scraper.py
```

## API Documentation

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/me` - Get current user

### Food & Nutrition
- `GET /api/food/search` - Search food items with nutrition
- `GET /api/food/locations` - Get dining locations
- `GET /api/nutrition/*` - Nutrition scraping endpoints

### Meal Management
- `POST /api/meals/log` - Log a meal
- `GET /api/meals/today` - Get today's meals
- `GET /api/meals/history` - Get meal history
- `GET /api/dashboard/macros/{date}` - Get daily macros

## Development

### Code Structure
```
├── backend/
│   ├── server.py              # Main FastAPI server
│   ├── nutrition_scraper.py   # Web scraping module
│   ├── requirements.txt       # Python dependencies
│   └── test_nutrition_scraper.py
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   └── components/       # UI components
│   └── package.json
└── README.md
```

### Testing
- **Backend**: Comprehensive API testing with `backend_test.py`
- **Nutrition Scraper**: Dedicated testing with `test_nutrition_scraper.py`
- **Frontend**: React testing utilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Legal & Ethical Considerations

- **Respectful Scraping**: Rate limiting and appropriate delays
- **Terms of Service**: Compliance with UMass dining website policies
- **Data Accuracy**: Fallback systems for reliability
- **User Privacy**: Secure authentication and data handling

## Support

For issues or questions:
1. Check the documentation
2. Review the test outputs
3. Verify website availability
4. Check the logging output

## License

This project is designed for educational and personal use. Please respect UMass dining services and website terms of use.
