# UMass Nutrition Scraper

This module replaces the estimation-based nutrition system with real, live nutritional data scraped directly from UMass dining websites.

## Overview

The nutrition scraper visits UMass dining menu pages and extracts detailed nutritional information for each food item, including:
- Calories
- Protein
- Total Fat
- Saturated Fat
- Trans Fat
- Cholesterol
- Sodium
- Total Carbohydrates
- Dietary Fiber
- Total Sugars
- Serving Size

## Supported Locations

### Main Dining Commons
- Berkshire: `https://umassdining.com/locations-menus/berkshire/menu`
- Franklin: `https://umassdining.com/locations-menus/franklin/menu`
- Worcester: `https://umassdining.com/locations-menus/worcester/menu`
- Hampshire: `https://umassdining.com/locations-menus/hampshire/menu`

### Campus Center Eateries
- People's Organic Coffee
- Harvest Market
- Tavola
- Yum! Bakery
- Green Fields
- Tamales
- Wasabi
- Deli Delish
- Star Ginger
- The Grill

## Installation

1. Install required dependencies:
```bash
pip install beautifulsoup4 lxml
```

2. The scraper is automatically imported and initialized in `server.py`

## Usage

### Basic Usage

```python
from nutrition_scraper import UMassNutritionScraper

# Initialize scraper
scraper = UMassNutritionScraper()

# Scrape a specific location
nutrition_data = scraper.scrape_location("berkshire")

# Search for specific food items
chicken_items = scraper.search_food_nutrition("chicken", "worcester")

# Get all available locations
locations = scraper.get_available_locations()

# Clean up
scraper.close()
```

### API Endpoints

The scraper is integrated into the FastAPI server with these new endpoints:

#### 1. Scrape Specific Location
```
GET /api/nutrition/scrape/{location}
```
Scrapes nutrition data from a specific dining location.

#### 2. Search Nutrition Data
```
GET /api/nutrition/search?food_name={name}&location={location}
```
Searches for nutrition data for a specific food item.

#### 3. Get Available Locations
```
GET /api/nutrition/locations
```
Returns list of all available dining locations for nutrition scraping.

#### 4. Scrape All Locations
```
POST /api/nutrition/scrape-all
```
Scrapes nutrition data from all available locations.

## How It Works

### 1. HTML Parsing Strategies
The scraper uses multiple parsing strategies to handle different website layouts:

- **Table-based parsing**: Looks for nutrition tables with structured data
- **Card-based parsing**: Extracts data from card layouts and menu items
- **Text pattern matching**: Uses regex to find nutrition values in text

### 2. Data Extraction
For each food item, the scraper:
1. Extracts the food name
2. Searches for nutrition values using pattern matching
3. Converts text values to numeric data
4. Handles various units and formats
5. Removes duplicates and validates data

### 3. Fallback System
If web scraping fails, the system falls back to the original estimation algorithm to ensure the application continues to function.

## Testing

Run the test script to verify the scraper works:

```bash
# Basic tests
python test_nutrition_scraper.py

# Test specific location
python test_nutrition_scraper.py berkshire
```

## Error Handling

The scraper includes comprehensive error handling:
- Network timeouts and connection errors
- HTML parsing failures
- Missing or malformed data
- Rate limiting protection
- Graceful fallbacks

## Performance Considerations

- **Rate limiting**: 1-second delay between location scrapes
- **Timeout handling**: 15-second timeout for page requests
- **Session reuse**: Uses persistent HTTP sessions
- **Caching**: Results can be cached to avoid repeated scraping

## Data Structure

Each nutrition item is returned as a `NutritionData` object:

```python
@dataclass
class NutritionData:
    name: str
    serving_size: Optional[str] = None
    calories: Optional[int] = None
    total_fat: Optional[float] = None
    saturated_fat: Optional[float] = None
    trans_fat: Optional[float] = None
    cholesterol: Optional[float] = None
    sodium: Optional[float] = None
    total_carbohydrates: Optional[float] = None
    dietary_fiber: Optional[float] = None
    total_sugars: Optional[float] = None
    protein: Optional[float] = None
```

## Integration with Existing System

The scraper seamlessly integrates with the existing food search system:

1. **Replaces estimation**: `estimate_nutrition()` function is replaced with `get_real_nutrition()`
2. **Maintains compatibility**: Same return format for seamless integration
3. **Fallback support**: Falls back to estimation if scraping fails
4. **Location mapping**: Maps dining location names to scraper location keys

## Troubleshooting

### Common Issues

1. **No nutrition data found**: The website structure may have changed
2. **Scraping errors**: Check network connectivity and website availability
3. **Missing dependencies**: Ensure `beautifulsoup4` and `lxml` are installed

### Debug Mode

Enable detailed logging by setting the log level:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

- **Caching system**: Store scraped data to reduce repeated requests
- **Scheduled scraping**: Automatically update nutrition data
- **Data validation**: Verify scraped data against known ranges
- **User contributions**: Allow users to submit nutrition corrections

## Legal Considerations

- Respects website terms of service
- Includes rate limiting to avoid overwhelming servers
- Uses appropriate user agent strings
- Implements error handling for network issues

## Support

For issues or questions about the nutrition scraper:
1. Check the test script output
2. Review the logging output
3. Verify website availability
4. Test with different locations
