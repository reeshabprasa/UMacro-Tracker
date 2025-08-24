#!/usr/bin/env python3
"""
Test script for the UMass Nutrition Scraper
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from nutrition_scraper import UMassNutritionScraper, get_food_nutrition
import json

def test_scraper():
    """Test the nutrition scraper functionality"""
    print("🧪 Testing UMass Nutrition Scraper")
    print("=" * 50)
    
    scraper = UMassNutritionScraper()
    
    try:
        # Test 1: Get available locations
        print("\n1. Testing available locations...")
        locations = scraper.get_available_locations()
        print(f"   Found {len(locations)} locations:")
        for i, loc in enumerate(locations[:5], 1):  # Show first 5
            print(f"   {i}. {loc}")
        if len(locations) > 5:
            print(f"   ... and {len(locations) - 5} more")
        
        # Test 2: Test a specific location scrape
        print("\n2. Testing location scrape (Berkshire)...")
        try:
            berkshire_data = scraper.scrape_location("berkshire")
            print(f"   Scraped {len(berkshire_data)} items from Berkshire")
            if berkshire_data:
                print(f"   Sample item: {berkshire_data[0].name}")
                if berkshire_data[0].calories:
                    print(f"   Calories: {berkshire_data[0].calories}")
                if berkshire_data[0].protein:
                    print(f"   Protein: {berkshire_data[0].protein}g")
        except Exception as e:
            print(f"   Error scraping Berkshire: {e}")
        
        # Test 3: Test food search
        print("\n3. Testing food search...")
        try:
            search_results = scraper.search_food_nutrition("chicken")
            print(f"   Found {len(search_results)} items containing 'chicken'")
            if search_results:
                print(f"   Sample result: {search_results[0].name}")
                if search_results[0].calories:
                    print(f"   Calories: {search_results[0].calories}")
        except Exception as e:
            print(f"   Error searching for chicken: {e}")
        
        # Test 4: Test convenience function
        print("\n4. Testing convenience function...")
        try:
            quick_results = get_food_nutrition("pizza")
            print(f"   Quick search found {len(quick_results)} pizza items")
        except Exception as e:
            print(f"   Error with convenience function: {e}")
        
        print("\n✅ Basic tests completed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return False
    
    finally:
        scraper.close()
    
    return True

def test_specific_location(location_name: str):
    """Test scraping a specific location"""
    print(f"\n🔍 Testing specific location: {location_name}")
    print("=" * 50)
    
    scraper = UMassNutritionScraper()
    
    try:
        nutrition_data = scraper.scrape_location(location_name)
        print(f"Successfully scraped {len(nutrition_data)} items")
        
        if nutrition_data:
            print("\nSample items:")
            for i, item in enumerate(nutrition_data[:3], 1):  # Show first 3
                print(f"\n{i}. {item.name}")
                if item.calories:
                    print(f"   Calories: {item.calories}")
                if item.protein:
                    print(f"   Protein: {item.protein}g")
                if item.total_carbohydrates:
                    print(f"   Carbs: {item.total_carbohydrates}g")
                if item.total_fat:
                    print(f"   Fat: {item.total_fat}g")
                if item.serving_size:
                    print(f"   Serving: {item.serving_size}")
        
        return True
        
    except Exception as e:
        print(f"Error scraping {location_name}: {e}")
        return False
    
    finally:
        scraper.close()

def main():
    """Main test function"""
    if len(sys.argv) > 1:
        # Test specific location
        location = sys.argv[1]
        test_specific_location(location)
    else:
        # Run basic tests
        test_scraper()

if __name__ == "__main__":
    main()
