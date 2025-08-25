from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import os
import logging
import requests

import uuid
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr

# Import the nutrition scraper
from nutrition_scraper import UMassNutritionScraper, NutritionData

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
SECRET_KEY = os.environ.get('SECRET_KEY', 'umass-macro-tracker-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="UMacro Tracker API")
api_router = APIRouter(prefix="/api")

# Initialize nutrition scraper
nutrition_scraper = UMassNutritionScraper()

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class FoodItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    dining_location: str
    meal_type: str
    calories: int = 0
    protein: float = 0.0
    carbs: float = 0.0
    fat: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MealLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    food_name: str
    dining_location: str
    meal_type: str
    portion_size: float = 1.0
    calories: int
    protein: float
    carbs: float
    fat: float
    date: str  # YYYY-MM-DD format
    logged_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MealLogCreate(BaseModel):
    food_name: str
    dining_location: str
    meal_type: str
    portion_size: float = 1.0
    calories: int
    protein: float
    carbs: float
    fat: float
    date: str

class DailyMacros(BaseModel):
    date: str
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    meal_count: int

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)



# Auth endpoints
@api_router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = hash_password(user_data.password)
    user = User(username=user_data.username, email=user_data.email)
    user_dict = user.dict()
    user_dict['password_hash'] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_obj = User(**user)
    access_token = create_access_token(data={"sub": user_obj.id})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Food endpoints
@api_router.get("/food/search")
async def search_food(q: str = "", location: str = ""):
    """Search for food items using the nutrition scraper for real data"""
    try:
        if not q.strip():
            return []
        
        # Map frontend location names to scraper location keys
        location_mapping = {
            'berkshire': 'berkshire',
            'franklin': 'franklin', 
            'worcester': 'worcester',
            'hampshire': 'hampshire',
            'peoples organic coffee': 'peoples_organic_coffee',
            'harvest market': 'harvest_market',
            'harvest': 'harvest',
            'tavola': 'tavola',
            'yum bakery': 'yum_bakery',
            'green fields': 'green_fields',
            'tamales': 'tamales',
            'wasabi': 'wasabi',
            'deli delish': 'deli_delish',
            'star ginger': 'star_ginger',
            'grill': 'grill'
        }
        
        # Find the matching location key
        location_key = None
        if location:
            for key, value in location_mapping.items():
                if key in location.lower():
                    location_key = value
                    break
        
        # Search for nutrition data
        if location_key:
            # Search in specific location
            nutrition_items = nutrition_scraper.search_food_nutrition(q, location_key)
        else:
            # Search in all locations
            nutrition_items = nutrition_scraper.search_food_nutrition(q)
        
        # Convert to the expected format
        results = []
        for item in nutrition_items:
            results.append({
                'name': item.name,
                'dining_location': item.dining_location,
                'meal_type': item.meal_type or 'Lunch',  # Default to Lunch if not specified
                'calories': item.calories or 0,
                'protein': item.protein or 0.0,
                'carbs': item.total_carbohydrates or 0.0,
                'fat': item.total_fat or 0.0
            })
        
        return results[:50]  # Limit results
    except Exception as e:
        logging.error(f"Error searching food data: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching food data: {str(e)}")

@api_router.get("/food/locations")
async def get_dining_locations():
    try:
        response = requests.get("https://www.umassdining.com/uapp/get_infov2", timeout=10)
        dining_data = response.json()
        
        locations = []
        for location_data in dining_data:
            locations.append({
                'name': location_data.get('location_title', ''),
                'description': location_data.get('short_description_v2', ''),
                'hours': location_data.get('opening_hours', '') + ' - ' + location_data.get('closing_hours', ''),
                'is_open': location_data.get('opening_hours') != 'Closed'
            })
        
        return locations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching locations: {str(e)}")

# New nutrition scraping endpoints
@api_router.get("/nutrition/scrape/{location}")
async def scrape_location_nutrition(location: str):
    """Scrape nutrition data from a specific dining location"""
    try:
        nutrition_data = nutrition_scraper.scrape_location(location)
        return {
            "location": location,
            "items_count": len(nutrition_data),
            "nutrition_data": nutrition_data
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scraping nutrition data: {str(e)}")

@api_router.get("/nutrition/search")
async def search_nutrition(food_name: str, location: str = None):
    """Search for nutrition data for a specific food item"""
    try:
        nutrition_items = nutrition_scraper.search_food_nutrition(food_name, location)
        return {
            "food_name": food_name,
            "location": location,
            "results_count": len(nutrition_items),
            "nutrition_items": nutrition_items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching nutrition data: {str(e)}")

@api_router.get("/nutrition/locations")
async def get_nutrition_locations():
    """Get list of all available dining locations for nutrition scraping"""
    try:
        locations = nutrition_scraper.get_available_locations()
        return {
            "locations": locations,
            "total_count": len(locations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting nutrition locations: {str(e)}")

@api_router.post("/nutrition/scrape-all")
async def scrape_all_locations():
    """Scrape nutrition data from all available locations"""
    try:
        all_data = nutrition_scraper.scrape_all_locations()
        total_items = sum(len(items) for items in all_data.values())
        return {
            "locations_scraped": len(all_data),
            "total_items": total_items,
            "data": all_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scraping all locations: {str(e)}")

# Meal logging endpoints
@api_router.post("/meals/log", response_model=MealLog)
async def log_meal(meal_data: MealLogCreate, current_user: User = Depends(get_current_user)):
    meal_log = MealLog(
        user_id=current_user.id,
        **meal_data.dict()
    )
    
    meal_dict = meal_log.dict()
    meal_dict['logged_at'] = meal_dict['logged_at'].isoformat()
    
    # Ensure the ID is properly set
    meal_dict['_id'] = meal_dict['id']
    
    await db.meal_logs.insert_one(meal_dict)
    return meal_log

@api_router.get("/meals/today", response_model=List[MealLog])
async def get_today_meals(current_user: User = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    meals = await db.meal_logs.find({"user_id": current_user.id, "date": today}).to_list(length=None)
    
    for meal in meals:
        if isinstance(meal.get('logged_at'), str):
            meal['logged_at'] = datetime.fromisoformat(meal['logged_at'])
        # Ensure the ID is properly mapped from MongoDB _id
        if '_id' in meal:
            meal['id'] = str(meal['_id'])
    
    return [MealLog(**meal) for meal in meals]

@api_router.delete("/meals/{meal_id}")
async def delete_meal(meal_id: str, current_user: User = Depends(get_current_user)):
    # Find the meal and verify ownership
    meal = await db.meal_logs.find_one({"_id": meal_id, "user_id": current_user.id})
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found or access denied")
    
    # Delete the meal
    result = await db.meal_logs.delete_one({"_id": meal_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    return {"message": "Meal deleted successfully"}

@api_router.get("/meals/history")
async def get_meal_history(days: int = 14, current_user: User = Depends(get_current_user)):
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    date_range = []
    current = start_date
    while current <= end_date:
        date_range.append(current.strftime('%Y-%m-%d'))
        current += timedelta(days=1)
    
    meals = await db.meal_logs.find({
        "user_id": current_user.id,
        "date": {"$in": date_range}
    }).to_list(length=None)
    
    # Group by date
    daily_macros = {}
    for date in date_range:
        daily_meals = [m for m in meals if m['date'] == date]
        total_calories = sum(m['calories'] * m['portion_size'] for m in daily_meals)
        total_protein = sum(m['protein'] * m['portion_size'] for m in daily_meals)
        total_carbs = sum(m['carbs'] * m['portion_size'] for m in daily_meals)
        total_fat = sum(m['fat'] * m['portion_size'] for m in daily_meals)
        
        daily_macros[date] = DailyMacros(
            date=date,
            total_calories=int(total_calories),
            total_protein=round(total_protein, 1),
            total_carbs=round(total_carbs, 1),
            total_fat=round(total_fat, 1),
            meal_count=len(daily_meals)
        )
    
    return daily_macros

@api_router.get("/dashboard/macros/{date}", response_model=DailyMacros)
async def get_daily_macros(date: str, current_user: User = Depends(get_current_user)):
    meals = await db.meal_logs.find({"user_id": current_user.id, "date": date}).to_list(length=None)
    
    total_calories = sum(m['calories'] * m['portion_size'] for m in meals)
    total_protein = sum(m['protein'] * m['portion_size'] for m in meals)
    total_carbs = sum(m['carbs'] * m['portion_size'] for m in meals)
    total_fat = sum(m['fat'] * m['portion_size'] for m in meals)
    
    return DailyMacros(
        date=date,
        total_calories=int(total_calories),
        total_protein=round(total_protein, 1),
        total_carbs=round(total_carbs, 1),
        total_fat=round(total_fat, 1),
        meal_count=len(meals)
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    nutrition_scraper.close()