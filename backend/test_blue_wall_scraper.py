#!/usr/bin/env python3
"""
Test script for Blue Wall dining locations in UMass Nutrition Scraper (excludes Paciugo)
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from nutrition_scraper import UMassNutritionScraper
import json

def test_blue_wall_locations():
    """Test scraping from all Blue Wall dining locations"""
    print("🔍 Testing Blue Wall Dining Locations")
    print("=" * 50)
    
    scraper = UMassNutritionScraper()
    
    # Blue Wall locations to test
    blue_wall_locations = [
        "green_fields",
        "tamales", 
        "wasabi",
        "deli_delish",
        "star_ginger",
        "grill",
        "harvest",
        "tavola"
    ]
    
    results = {}
    
    for location in blue_wall_locations:
        print(f"\n📍 Testing {location}...")
        try:
            # Test if the location is accessible
            nutrition_data = scraper.scrape_location(location)
            results[location] = {
                "status": "success",
                "items_count": len(nutrition_data),
                "sample_items": []
            }
            
            # Show sample items
            if nutrition_data:
                for i, item in enumerate(nutrition_data[:3], 1):
                    sample_item = {
                        "name": item.name,
                        "calories": item.calories,
                        "protein": item.protein,
                        "carbs": item.total_carbohydrates,
                        "fat": item.total_fat
                    }
                    results[location]["sample_items"].append(sample_item)
                
                print(f"   ✅ Successfully scraped {len(nutrition_data)} items")
                if nutrition_data[0].calories:
                    print(f"   📊 Sample: {nutrition_data[0].name} - {nutrition_data[0].calories} cal")
            else:
                print(f"   ⚠️  No nutrition data found")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results[location] = {
                "status": "error",
                "error": str(e),
                "items_count": 0,
                "sample_items": []
            }
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 SUMMARY")
    print("=" * 50)
    
    successful = 0
    total_items = 0
    
    for location, result in results.items():
        status_icon = "✅" if result["status"] == "success" else "❌"
        print(f"{status_icon} {location}: {result['items_count']} items")
        
        if result["status"] == "success":
            successful += 1
            total_items += result["items_count"]
    
    print(f"\n📊 Overall Results:")
    print(f"   Successful locations: {successful}/{len(blue_wall_locations)}")
    print(f"   Total items scraped: {total_items}")
    
    # Save detailed results to file
    with open("blue_wall_test_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n💾 Detailed results saved to: blue_wall_test_results.json")
    
    scraper.close()
    return results

def test_specific_location(location_name: str):
    """Test a specific Blue Wall location"""
    print(f"\n🔍 Testing specific location: {location_name}")
    print("=" * 50)
    
    scraper = UMassNutritionScraper()
    
    try:
        nutrition_data = scraper.scrape_location(location_name)
        print(f"Successfully scraped {len(nutrition_data)} items")
        
        if nutrition_data:
            print("\nSample items:")
            for i, item in enumerate(nutrition_data[:5], 1):
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

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Test specific location
        location = sys.argv[1]
        test_specific_location(location)
    else:
        # Test all Blue Wall locations
        test_blue_wall_locations()
