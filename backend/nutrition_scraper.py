import requests
from bs4 import BeautifulSoup
import re
import logging
from typing import List, Dict, Optional, Union
from dataclasses import dataclass
import time
from urllib.parse import urljoin, urlparse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class NutritionData:
    """Structured nutrition data for a food item"""
    name: str
    dining_location: Optional[str] = None
    meal_type: Optional[str] = None
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

class UMassNutritionScraper:
    """Web scraper for UMass dining nutrition information"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.base_url = "https://umassdining.com"
        
        # Dining hall URL mappings
        self.dining_halls = {
            "berkshire": "https://umassdining.com/locations-menus/berkshire/menu",
            "franklin": "https://umassdining.com/locations-menus/franklin/menu",
            "worcester": "https://umassdining.com/locations-menus/worcester/menu",
            "hampshire": "https://umassdining.com/locations-menus/hampshire/menu"
        }
        
        # Campus center eatery URL mappings (these may not have individual menu pages)
        # Commenting out until we find the correct URLs
        self.campus_eateries = {
            # "peoples_organic_coffee": "https://umassdining.com/locations-menus/peoples-organic-coffee/menu",
            # "harvest_market": "https://umassdining.com/locations-menus/harvest-market/menu",
            # "tavola": "https://umassdining.com/locations-menus/tavola/menu",
            # "yum_bakery": "https://umassdining.com/locations-menus/yum-bakery/menu",
            # "green_fields": "https://umassdining.com/locations-menus/green-fields/menu",
            # "tamales": "https://umassdining.com/locations-menus/tamales/menu",
            # "wasabi": "https://umassdining.com/locations-menus/wasabi/menu",
            # "deli_delish": "https://umassdining.com/locations-menus/deli-delish/menu",
            # "star_ginger": "https://umassdining.com/locations-menus/star-ginger/menu",
            # "grill": "https://umassdining.com/locations-menus/grill/menu"
        }
        
        # All available locations
        self.all_locations = {**self.dining_halls, **self.campus_eateries}
    
    def _extract_number_from_text(self, text: str) -> Optional[float]:
        """Extract numeric value from text, handling various formats"""
        if not text:
            return None
        
        # Remove common units and extract numbers
        cleaned = re.sub(r'[^\d.]', '', text.strip())
        try:
            return float(cleaned) if cleaned else None
        except ValueError:
            return None
    
    def _parse_nutrition_table(self, soup: BeautifulSoup) -> List[NutritionData]:
        """Parse nutrition information from HTML tables"""
        nutrition_items = []
        
        # Look for nutrition items with data attributes (UMass dining structure)
        nutrition_items_elements = soup.find_all(['li'], class_='lightbox-nutrition')
        
        for item in nutrition_items_elements:
            try:
                # Find the anchor tag with nutrition data
                nutrition_link = item.find('a')
                if not nutrition_link:
                    continue
                
                # Extract food name from data-dish-name attribute or link text
                food_name = nutrition_link.get('data-dish-name')
                if not food_name:
                    food_name = nutrition_link.get_text(strip=True)
                
                if not food_name or len(food_name) < 2:
                    continue
                
                # Initialize nutrition data
                nutrition = NutritionData(name=food_name)
                
                # Extract nutrition values from data attributes
                if nutrition_link.get('data-calories'):
                    try:
                        nutrition.calories = int(nutrition_link.get('data-calories'))
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-protein'):
                    try:
                        protein_text = nutrition_link.get('data-protein')
                        nutrition.protein = self._extract_number_from_text(protein_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-total-fat'):
                    try:
                        fat_text = nutrition_link.get('data-total-fat')
                        nutrition.total_fat = self._extract_number_from_text(fat_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-sat-fat'):
                    try:
                        sat_fat_text = nutrition_link.get('data-sat-fat')
                        nutrition.saturated_fat = self._extract_number_from_text(sat_fat_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-trans-fat'):
                    try:
                        trans_fat_text = nutrition_link.get('data-trans-fat')
                        nutrition.trans_fat = self._extract_number_from_text(trans_fat_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-cholesterol'):
                    try:
                        cholesterol_text = nutrition_link.get('data-cholesterol')
                        nutrition.cholesterol = self._extract_number_from_text(cholesterol_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-sodium'):
                    try:
                        sodium_text = nutrition_link.get('data-sodium')
                        nutrition.sodium = self._extract_number_from_text(sodium_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-total-carb'):
                    try:
                        carb_text = nutrition_link.get('data-total-carb')
                        nutrition.total_carbohydrates = self._extract_number_from_text(carb_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-dietary-fiber'):
                    try:
                        fiber_text = nutrition_link.get('data-dietary-fiber')
                        nutrition.dietary_fiber = self._extract_number_from_text(fiber_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-sugars'):
                    try:
                        sugars_text = nutrition_link.get('data-sugars')
                        nutrition.total_sugars = self._extract_number_from_text(sugars_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-serving-size'):
                    nutrition.serving_size = nutrition_link.get('data-serving-size')
                
                # Only add items that have at least some nutrition data
                if any([nutrition.calories, nutrition.protein, nutrition.total_fat, nutrition.total_carbohydrates]):
                    nutrition_items.append(nutrition)
            
            except Exception as e:
                logger.warning(f"Error parsing nutrition item: {e}")
                continue
        
        return nutrition_items
    
    def _parse_nutrition_cards(self, soup: BeautifulSoup) -> List[NutritionData]:
        """Parse nutrition information from card-based layouts"""
        nutrition_items = []
        
        # Look for nutrition cards or menu items
        nutrition_cards = soup.find_all(['div', 'article'], class_=re.compile(r'card|item|dish|food|menu-item', re.I))
        
        for card in nutrition_cards:
            try:
                # Extract food name
                name_elem = card.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'], 
                                    class_=re.compile(r'name|title|dish|food', re.I))
                if not name_elem:
                    continue
                
                name = name_elem.get_text(strip=True)
                if not name or len(name) < 2:
                    continue
                
                # Initialize nutrition data
                nutrition = NutritionData(name=name)
                
                # Look for nutrition information within the card
                nutrition_text = card.get_text()
                
                # Extract calories
                cal_match = re.search(r'(\d+)\s*cal', nutrition_text, re.I)
                if cal_match:
                    nutrition.calories = int(cal_match.group(1))
                
                # Extract protein
                protein_match = re.search(r'(\d+(?:\.\d+)?)\s*g?\s*protein', nutrition_text, re.I)
                if protein_match:
                    nutrition.protein = float(protein_match.group(1))
                
                # Extract total fat
                fat_match = re.search(r'(\d+(?:\.\d+)?)\s*g?\s*fat', nutrition_text, re.I)
                if fat_match:
                    nutrition.total_fat = float(fat_match.group(1))
                
                # Extract carbs
                carb_match = re.search(r'(\d+(?:\.\d+)?)\s*g?\s*carb', nutrition_text, re.I)
                if carb_match:
                    nutrition.total_carbohydrates = float(carb_match.group(1))
                
                # Extract serving size
                serving_match = re.search(r'serving.*?(\d+(?:\.\d+)?)\s*(oz|g|ml|cup|tbsp)', nutrition_text, re.I)
                if serving_match:
                    nutrition.serving_size = f"{serving_match.group(1)} {serving_match.group(2)}"
                
                # Only add items that have at least some nutrition data
                if any([nutrition.calories, nutrition.protein, nutrition.total_fat, nutrition.total_carbohydrates]):
                    nutrition_items.append(nutrition)
            
            except Exception as e:
                logger.warning(f"Error parsing nutrition card: {e}")
                continue
        
        # Also look for UMass dining structure in case it wasn't caught by the main parser
        umass_items = soup.find_all(['li'], class_='lightbox-nutrition')
        for item in umass_items:
            try:
                nutrition_link = item.find('a')
                if not nutrition_link:
                    continue
                
                food_name = nutrition_link.get('data-dish-name')
                if not food_name:
                    food_name = nutrition_link.get_text(strip=True)
                
                if not food_name or len(food_name) < 2:
                    continue
                
                nutrition = NutritionData(name=food_name)
                
                # Extract from data attributes
                if nutrition_link.get('data-calories'):
                    try:
                        nutrition.calories = int(nutrition_link.get('data-calories'))
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-protein'):
                    try:
                        protein_text = nutrition_link.get('data-protein')
                        nutrition.protein = self._extract_number_from_text(protein_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-total-fat'):
                    try:
                        fat_text = nutrition_link.get('data-total-fat')
                        nutrition.total_fat = self._extract_number_from_text(fat_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-total-carb'):
                    try:
                        carb_text = nutrition_link.get('data-total-carb')
                        nutrition.total_carbohydrates = self._extract_number_from_text(carb_text)
                    except (ValueError, TypeError):
                        pass
                
                if nutrition_link.get('data-serving-size'):
                    nutrition.serving_size = nutrition_link.get('data-serving-size')
                
                if any([nutrition.calories, nutrition.protein, nutrition.total_fat, nutrition.total_carbohydrates]):
                    nutrition_items.append(nutrition)
            
            except Exception as e:
                logger.warning(f"Error parsing UMass nutrition item in cards: {e}")
                continue
        
        return nutrition_items
    
    def scrape_location(self, location_name: str) -> List[NutritionData]:
        """Scrape nutrition data from a specific dining location"""
        location_name_lower = location_name.lower().replace(' ', '_')
        
        if location_name_lower not in self.all_locations:
            raise ValueError(f"Unknown location: {location_name}. Available locations: {list(self.all_locations.keys())}")
        
        url = self.all_locations[location_name_lower]
        logger.info(f"Scraping nutrition data from: {url}")
        
        try:
            # Fetch the page
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try different parsing strategies
            nutrition_items = []
            
            # Strategy 1: Parse nutrition tables
            nutrition_items.extend(self._parse_nutrition_table(soup))
            
            # Strategy 2: Parse nutrition cards
            nutrition_items.extend(self._parse_nutrition_cards(soup))
            
            # Remove duplicates based on name and set location info
            seen_names = set()
            unique_items = []
            for item in nutrition_items:
                if item.name.lower() not in seen_names:
                    seen_names.add(item.name.lower())
                    # Set dining location and meal type
                    item.dining_location = location_name.replace('_', ' ').title()
                    item.meal_type = 'Lunch'  # Default meal type
                    unique_items.append(item)
            
            logger.info(f"Successfully scraped {len(unique_items)} nutrition items from {location_name}")
            return unique_items
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error scraping {location_name}: {e}")
            raise
    
    def scrape_all_locations(self) -> Dict[str, List[NutritionData]]:
        """Scrape nutrition data from all available locations"""
        all_data = {}
        
        for location_name in self.all_locations.keys():
            try:
                logger.info(f"Scraping {location_name}...")
                nutrition_data = self.scrape_location(location_name)
                all_data[location_name] = nutrition_data
                
                # Be respectful with rate limiting
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Failed to scrape {location_name}: {e}")
                all_data[location_name] = []
        
        return all_data
    
    def search_food_nutrition(self, food_name: str, location: str = None) -> List[NutritionData]:
        """Search for nutrition data for a specific food item"""
        if location:
            # Search in specific location
            try:
                nutrition_data = self.scrape_location(location)
                return [item for item in nutrition_data if food_name.lower() in item.name.lower()]
            except Exception as e:
                logger.error(f"Error searching in {location}: {e}")
                return []
        else:
            # Search in all locations
            results = []
            for location_name in self.all_locations.keys():
                try:
                    nutrition_data = self.scrape_location(location_name)
                    matching_items = [item for item in nutrition_data if food_name.lower() in item.name.lower()]
                    for item in matching_items:
                        item.dining_location = location_name.replace('_', ' ').title()
                        item.meal_type = 'Lunch'  # Default meal type
                    results.extend(matching_items)
                except Exception as e:
                    logger.warning(f"Error searching in {location_name}: {e}")
                    continue
            
            return results
    
    def get_available_locations(self) -> List[str]:
        """Get list of all available dining locations"""
        return list(self.all_locations.keys())
    
    def close(self):
        """Close the session"""
        self.session.close()

# Convenience function for quick nutrition lookup
def get_food_nutrition(food_name: str, location: str = None) -> List[NutritionData]:
    """Quick function to get nutrition data for a food item"""
    scraper = UMassNutritionScraper()
    try:
        return scraper.search_food_nutrition(food_name, location)
    finally:
        scraper.close()
