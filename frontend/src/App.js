import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import shadcn components
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Calendar } from './components/ui/calendar';
import { toast, Toaster } from 'sonner';
import Typewriter from 'typewriter-effect';

// Icons
import { Search, Plus, Calendar as CalendarIcon, TrendingUp, Utensils, User, LogOut, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Debug logging
console.log('Environment variables:', {
  REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
  BACKEND_URL: BACKEND_URL,
  API: API
});

// Auth Context
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('Login attempt:', { email, API });
    try {
      const response = await axios.post(`${API}/login`, { email, password });
      console.log('Login response:', response.data);
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      toast.success('Welcome back!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    console.log('Register attempt:', { username, email, API });
    try {
      const response = await axios.post(`${API}/register`, { username, email, password });
      console.log('Register response:', response.data);
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Component
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-umass-maroon via-red-800 to-red-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-umass-maroon">UMacro Tracker</CardTitle>
          <CardDescription className="text-gray-600">
            Track your UMass dining macros with ease @{' '}
            <Typewriter
              options={{
                strings: ['Worcester', 'Berkshire', 'Franklin', 'Hampshire', 'Blue Wall'],
                autoStart: true,
                loop: true,
                wrapperClassName: 'text-umass-maroon',
                cursorClassName: 'text-umass-maroon'
              }}
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <Input
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="border-gray-300 focus:border-umass-maroon focus:ring-umass-maroon"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-umass-maroon focus:ring-umass-maroon"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-umass-maroon focus:ring-umass-maroon"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-umass-maroon hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Food Search Component
function FoodSearch({ onFoodSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API}/food/locations`);
      setLocations(response.data.filter(loc => loc.is_open));
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    console.log('Searching for:', searchQuery, 'Location:', selectedLocation);
    setLoading(true);
    try {
      const response = await axios.get(`${API}/food/search`, {
        params: { q: searchQuery, location: selectedLocation }
      });
      console.log('Search response:', response.data.length, 'items');
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Failed to search food items');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Auto-search after user stops typing
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedLocation]);

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          placeholder="Search for food items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-umass-maroon"
        >
          <option value="">All Locations</option>
          {locations.map((location, index) => (
            <option key={index} value={location.name}>{location.name}</option>
          ))}
        </select>
        <Button onClick={handleSearch} disabled={loading} className="bg-umass-maroon hover:bg-red-800">
          {loading ? '...' : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-umass-maroon mx-auto"></div>
        </div>
      )}

      <div className="grid gap-2 max-h-96 overflow-y-auto">
        {searchResults.map((food, index) => (
          <Card key={index} className="p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onFoodSelect(food)}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{food.name}</h4>
                <p className="text-sm text-gray-600">{food.dining_location}</p>
                <Badge variant="secondary" className="text-xs mt-1">{food.meal_type}</Badge>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-umass-maroon">{food.calories} cal</div>
                <div className="text-gray-600">P: {food.protein}g</div>
                <div className="text-gray-600">C: {food.carbs}g</div>
                <div className="text-gray-600">F: {food.fat}g</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {searchResults.length === 0 && searchQuery && !loading && (
        <div className="text-center py-8 text-gray-500">
          No food items found. Try a different search term.
        </div>
      )}
    </div>
  );
}

// Meal Logger Component
function MealLogger() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portion, setPortion] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealType, setMealType] = useState('Lunch');
  const [logging, setLogging] = useState(false);

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setMealType(food.meal_type);
  };

  const handleLogMeal = async () => {
    if (!selectedFood) return;

    setLogging(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      await axios.post(`${API}/meals/log`, {
        food_name: selectedFood.name,
        dining_location: selectedFood.dining_location,
        meal_type: mealType,
        portion_size: portion,
        calories: selectedFood.calories,
        protein: selectedFood.protein,
        carbs: selectedFood.carbs,
        fat: selectedFood.fat,
        date: dateStr
      });

      toast.success('Meal logged successfully!');
      setIsOpen(false);
      setSelectedFood(null);
      setPortion(1);
      // Trigger refresh of dashboard
      window.dispatchEvent(new CustomEvent('mealLogged'));
    } catch (error) {
      toast.error('Failed to log meal');
      console.error('Log meal error:', error);
    } finally {
      setLogging(false);
    }
  };

  const calculateAdjustedNutrition = () => {
    if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
      calories: Math.round(selectedFood.calories * portion),
      protein: Math.round(selectedFood.protein * portion * 10) / 10,
      carbs: Math.round(selectedFood.carbs * portion * 10) / 10,
      fat: Math.round(selectedFood.fat * portion * 10) / 10
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-umass-maroon hover:bg-red-800 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Log Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto !bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle>Log a Meal</DialogTitle>
          <DialogDescription>
            Search for food items from UMass dining halls and log your meals.
          </DialogDescription>
        </DialogHeader>

        {!selectedFood ? (
          <FoodSearch onFoodSelect={handleFoodSelect} />
        ) : (
          <div className="space-y-6">
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold text-lg">{selectedFood.name}</h3>
              <p className="text-gray-600">{selectedFood.dining_location}</p>
              <Badge variant="secondary" className="mt-2">{selectedFood.meal_type}</Badge>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Portion Size</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={portion}
                  onChange={(e) => setPortion(parseFloat(e.target.value) || 1)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Meal Type</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Calendar
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>

            <Card className="p-4 bg-umass-maroon/5 border-umass-maroon/20">
              <h4 className="font-semibold mb-2">Adjusted Nutrition</h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-umass-maroon">{calculateAdjustedNutrition().calories}</div>
                  <div className="text-sm text-gray-600">Calories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{calculateAdjustedNutrition().protein}g</div>
                  <div className="text-sm text-gray-600">Protein</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{calculateAdjustedNutrition().carbs}g</div>
                  <div className="text-sm text-gray-600">Carbs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{calculateAdjustedNutrition().fat}g</div>
                  <div className="text-sm text-gray-600">Fat</div>
                </div>
              </div>
            </Card>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setSelectedFood(null)} className="flex-1">
                Back to Search
              </Button>
              <Button onClick={handleLogMeal} disabled={logging} className="flex-1 bg-umass-maroon hover:bg-red-800">
                {logging ? 'Logging...' : 'Log Meal'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Custom Food Logger Component
function CustomFoodLogger() {
  const [isOpen, setIsOpen] = useState(false);
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  const [portion, setPortion] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealType, setMealType] = useState('Lunch');
  const [logging, setLogging] = useState(false);

  const handleInputChange = (field, value) => {
    setCustomFood(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogCustomMeal = async () => {
    if (!customFood.name || !customFood.calories || !customFood.protein || !customFood.carbs || !customFood.fat) {
      toast.error('Please fill in all fields');
      return;
    }

    setLogging(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      await axios.post(`${API}/meals/log`, {
        food_name: customFood.name,
        dining_location: 'Custom Food',
        meal_type: mealType,
        portion_size: portion,
        calories: parseInt(customFood.calories),
        protein: parseFloat(customFood.protein),
        carbs: parseFloat(customFood.carbs),
        fat: parseFloat(customFood.fat),
        date: dateStr
      });

      toast.success('Custom meal logged successfully!');
      setIsOpen(false);
      setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
      setPortion(1);
      // Trigger refresh of dashboard
      window.dispatchEvent(new CustomEvent('mealLogged'));
    } catch (error) {
      toast.error('Failed to log custom meal');
      console.error('Log custom meal error:', error);
    } finally {
      setLogging(false);
    }
  };

  const calculateAdjustedNutrition = () => {
    if (!customFood.calories || !customFood.protein || !customFood.carbs || !customFood.fat) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return {
      calories: Math.round(parseInt(customFood.calories) * portion),
      protein: Math.round(parseFloat(customFood.protein) * portion * 10) / 10,
      carbs: Math.round(parseFloat(customFood.carbs) * portion * 10) / 10,
      fat: Math.round(parseFloat(customFood.fat) * portion * 10) / 10
    };
  };

  const resetForm = () => {
    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setPortion(1);
    setMealType('Lunch');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-umass-maroon hover:bg-red-800 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Custom Food
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto !bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle>Add Custom Food Item</DialogTitle>
          <DialogDescription>
            Enter the nutritional information for your custom food item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Food Name</label>
            <Input
              type="text"
              placeholder="e.g., Homemade Smoothie"
              value={customFood.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Calories</label>
              <Input
                type="number"
                placeholder="0"
                value={customFood.calories}
                onChange={(e) => handleInputChange('calories', e.target.value)}
                className="w-full"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Portion Size</label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={portion}
                onChange={(e) => setPortion(parseFloat(e.target.value) || 1)}
                className="w-full"
              />
            </div>
          </div>

                      <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Protein (g)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={customFood.protein}
                  onChange={(e) => handleInputChange('protein', e.target.value)}
                  className="w-full"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Carbs (g)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={customFood.carbs}
                  onChange={(e) => handleInputChange('carbs', e.target.value)}
                  className="w-full"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fat (g)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={customFood.fat}
                  onChange={(e) => handleInputChange('fat', e.target.value)}
                  className="w-full"
                  min="0"
                />
              </div>
            </div>

                      <div className="space-y-2">
                <label className="text-sm font-medium">Meal Type</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

          <Card className="p-4 bg-umass-maroon/5 border-umass-maroon/20">
            <h4 className="font-semibold mb-2">Adjusted Nutrition</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-umass-maroon">{calculateAdjustedNutrition().calories}</div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{calculateAdjustedNutrition().protein}g</div>
                <div className="text-sm text-gray-600">Protein</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{calculateAdjustedNutrition().carbs}g</div>
                <div className="text-sm text-gray-600">Carbs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{calculateAdjustedNutrition().fat}g</div>
                <div className="text-sm text-gray-600">Fat</div>
              </div>
            </div>
          </Card>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={resetForm} className="flex-1">
              Reset
            </Button>
            <Button onClick={handleLogCustomMeal} disabled={logging} className="flex-1 bg-umass-maroon hover:bg-red-800">
              {logging ? 'Logging...' : 'Log Custom Meal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Dashboard Component
function Dashboard() {
  const { user, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [macros, setMacros] = useState({ total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0, meal_count: 0 });
  const [todayMeals, setTodayMeals] = useState([]);
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [macroGoals, setMacroGoals] = useState(() => {
    const saved = localStorage.getItem('macroGoals');
    return saved ? JSON.parse(saved) : { calories: 2000, protein: 150, carbs: 250, fat: 65 };
  });
  const [showGoalsDialog, setShowGoalsDialog] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchHistory();

    // Listen for meal logged events
    const handleMealLogged = () => {
      fetchDashboardData();
      fetchHistory();
    };
    window.addEventListener('mealLogged', handleMealLogged);
    return () => window.removeEventListener('mealLogged', handleMealLogged);
  }, [currentDate]);

  const fetchDashboardData = async () => {
    try {
      const dateStr = currentDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format in local timezone
      const [macrosResponse, mealsResponse] = await Promise.all([
        axios.get(`${API}/dashboard/macros/${dateStr}`),
        currentDate.toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA') ? axios.get(`${API}/meals/today`) : Promise.resolve({ data: [] })
      ]);
      
      setMacros(macrosResponse.data);
      setTodayMeals(mealsResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/meals/history?days=14`);
      console.log('History data received:', response.data);
      console.log('Today\'s date:', new Date().toLocaleDateString('en-CA'));
      console.log('History dates:', Object.keys(response.data));
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const navigateDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toLocaleDateString('en-CA') === today.toLocaleDateString('en-CA')) return 'Today';
    if (date.toLocaleDateString('en-CA') === yesterday.toLocaleDateString('en-CA')) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const updateMacroGoals = (newGoals) => {
    setMacroGoals(newGoals);
    localStorage.setItem('macroGoals', JSON.stringify(newGoals));
    setShowGoalsDialog(false);
  };

  const deleteMeal = async (mealId) => {
    try {
      await axios.delete(`${API}/meals/${mealId}`);
      toast.success('Meal deleted successfully');
      // Refresh dashboard data
      fetchDashboardData();
      fetchHistory();
    } catch (error) {
      console.error('Failed to delete meal:', error);
      toast.error('Failed to delete meal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umass-maroon"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <Utensils className="h-8 w-8 text-umass-maroon mr-3" />
              <h1 className="text-2xl font-bold text-umass-maroon">UMacro Tracker</h1>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowGoalsDialog(true)}
              className="text-sm"
            >
               Macro Goals
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.username}!</span>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => navigateDate(-1)}>
            ← Previous Day
          </Button>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{formatDate(currentDate)}</h2>
            <p className="text-gray-600">{currentDate.toLocaleDateString()}</p>
          </div>
          <Button variant="outline" onClick={() => navigateDate(1)}>
            Next Day →
          </Button>
        </div>

        {/* Macro Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-umass-maroon to-red-800 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 mb-2" />
                <div className="ml-4 flex-1">
                  <p className="text-white/80">Calories</p>
                  <p className="text-3xl font-bold">{macros.total_calories}</p>
                  <p className="text-white/70 text-sm">Goal: {macroGoals.calories}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${Math.min((macros.total_calories / macroGoals.calories) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-white/70 text-xs mt-1 text-right">
                  {Math.round((macros.total_calories / macroGoals.calories) * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 mb-2 text-2xl">🥩</div>
                <div className="ml-4 flex-1">
                  <p className="text-white/80">Protein</p>
                  <p className="text-3xl font-bold">{macros.total_protein}g</p>
                  <p className="text-white/70 text-sm">Goal: {macroGoals.protein}g</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${Math.min((macros.total_protein / macroGoals.protein) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-white/70 text-xs mt-1 text-right">
                  {Math.round((macros.total_protein / macroGoals.protein) * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 mb-2 text-2xl">🍞</div>
                <div className="ml-4 flex-1">
                  <p className="text-white/80">Carbs</p>
                  <p className="text-3xl font-bold">{macros.total_carbs}g</p>
                  <p className="text-white/70 text-sm">Goal: {macroGoals.carbs}g</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${Math.min((macros.total_carbs / macroGoals.carbs) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-white/70 text-xs mt-1 text-right">
                  {Math.round((macros.total_carbs / macroGoals.carbs) * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 mb-2 text-2xl">🥑</div>
                <div className="ml-4 flex-1">
                  <p className="text-white/80">Fat</p>
                  <p className="text-3xl font-bold">{macros.total_fat}g</p>
                  <p className="text-white/70 text-sm">Goal: {macroGoals.fat}g</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${Math.min((macros.total_fat / macroGoals.fat) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-white/70 text-xs mt-1 text-right">
                  {Math.round((macros.total_fat / macroGoals.fat) * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Meals */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Today's Meals ({macros.meal_count})</CardTitle>
                <div className="flex space-x-2">
                  <CustomFoodLogger />
                  <MealLogger />
                </div>
              </CardHeader>
              <CardContent>
                {todayMeals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No meals logged yet today.</p>
                    <p className="text-sm">Start by logging your first meal!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayMeals
                      .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
                      .map((meal, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{meal.food_name}</h4>
                          <p className="text-sm text-gray-600">{meal.dining_location} • {meal.meal_type}</p>
                          <p className="text-xs text-gray-500">Portion: {meal.portion_size}x</p>
                        </div>
                        <div className="text-right text-sm mr-4">
                          <div className="font-semibold text-umass-maroon">{Math.round(meal.calories * meal.portion_size)} cal</div>
                          <div className="text-gray-600">
                            P: {Math.round(meal.protein * meal.portion_size * 10) / 10}g • 
                            C: {Math.round(meal.carbs * meal.portion_size * 10) / 10}g • 
                            F: {Math.round(meal.fat * meal.portion_size * 10) / 10}g
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMeal(meal.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 14-Day History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  14-Day History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(history).reverse().map(([date, data]) => {
                    // Changes to also include the current day in the 14-day history
                    const displayDate = new Date(date);
                    displayDate.setDate(displayDate.getDate() + 1);
                    
                    return (
                      <div key={date} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">
                            {displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-500">{data.meal_count} meals</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold text-umass-maroon">{data.total_calories} cal</div>
                          <div className="text-xs text-gray-600">
                            {data.total_protein}p • {data.total_carbs}c • {data.total_fat}f
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Macro Goals Dialog */}
      <Dialog open={showGoalsDialog} onOpenChange={setShowGoalsDialog}>
        <DialogContent className="max-w-md !bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle>Set your daily macro goals</DialogTitle>
            <DialogDescription>
              Set your daily targets for calories and macronutrients
            </DialogDescription>
          </DialogHeader>
          <MacroGoalsForm 
            currentGoals={macroGoals} 
            onSave={updateMacroGoals} 
            onCancel={() => setShowGoalsDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Macro Goals Form Component
function MacroGoalsForm({ currentGoals, onSave, onCancel }) {
  const [goals, setGoals] = useState(currentGoals);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(goals);
  };

  const handleInputChange = (field, value) => {
    setGoals(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Calories</label>
          <Input
            type="number"
            value={goals.calories}
            onChange={(e) => handleInputChange('calories', e.target.value)}
            className="w-full"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Protein (g)</label>
          <Input
            type="number"
            value={goals.protein}
            onChange={(e) => handleInputChange('protein', e.target.value)}
            className="w-full"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Carbs (g)</label>
          <Input
            type="number"
            value={goals.carbs}
            onChange={(e) => handleInputChange('carbs', e.target.value)}
            className="w-full"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fat (g)</label>
          <Input
            type="number"
            value={goals.fat}
            onChange={(e) => handleInputChange('fat', e.target.value)}
            className="w-full"
            min="0"
          />
        </div>
      </div>
      <div className="flex space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-umass-maroon hover:bg-red-800">
          Save Goals
        </Button>
      </div>
    </form>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Route Guards
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umass-maroon"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/auth" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umass-maroon"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/" /> : children;
}

export default App;