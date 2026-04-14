from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import requests
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# ===== DATABASE SETUP =====
def setup_database():
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # User details table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            username TEXT,
            age INTEGER,
            current_weight REAL,
            target_weight REAL,
            height REAL,
            gender TEXT,
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    ''')
    
    # Meals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            meal_type TEXT NOT NULL,
            food_name TEXT NOT NULL,
            calories REAL,
            protein REAL,
            carbs REAL,
            fat REAL,
            date DATE DEFAULT CURRENT_DATE,
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    ''')
    
    # Water intake table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS water_intake (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            glasses INTEGER DEFAULT 0,
            date DATE DEFAULT CURRENT_DATE,
            UNIQUE(user_email, date),
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            user_email TEXT PRIMARY KEY,
            email_pref INTEGER DEFAULT 1,
            notifications INTEGER DEFAULT 1,
            units TEXT DEFAULT 'kcal',
            visibility TEXT DEFAULT 'private',
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database ready!")

# ===== REGISTER API =====
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    fullname = data.get('fullname')
    email = data.get('email')
    password = data.get('password')
    
    if not fullname or not email or not password:
        return jsonify({"success": False, "message": "All fields required"})
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    # Check if email exists
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"success": False, "message": "Email already registered"})
    
    # Insert new user
    cursor.execute("INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)",
                   (fullname, email, password))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Account Created Successfully!"})

# ===== LOGIN API =====
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"})
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({"success": False, "message": "Email not found. Please register first."})
    
    if user[3] != password:
        return jsonify({"success": False, "message": "Incorrect password"})
    
    return jsonify({
        "success": True,
        "message": "Login successful!",
        "fullname": user[1],
        "email": user[2]
    })

# ===== SAVE DETAILS API =====
@app.route('/api/save-details', methods=['POST'])
def save_details():
    data = request.json
    email = data.get('email')
    username = data.get('username')
    age = data.get('age')
    current_weight = data.get('current_weight')
    target_weight = data.get('target_weight')
    height = data.get('height')
    gender = data.get('gender')
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    # Check if details already exist
    cursor.execute("SELECT * FROM user_details WHERE user_email = ?", (email,))
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute('''
            UPDATE user_details 
            SET username=?, age=?, current_weight=?, target_weight=?, height=?, gender=?
            WHERE user_email=?
        ''', (username, age, current_weight, target_weight, height, gender, email))
    else:
        cursor.execute('''
            INSERT INTO user_details (user_email, username, age, current_weight, target_weight, height, gender)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (email, username, age, current_weight, target_weight, height, gender))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Details saved successfully!"})

# ===== SEARCH FOOD API (Free - Open Food Facts) =====
@app.route('/api/search-food', methods=['GET'])
def search_food():
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({"error": "Please enter a food name"}), 400
    
    # USDA FoodData Central API
    api_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {
        "api_key": "3uK93ZdeiyMi6h3PCFuVNeyrHNIItCpM3bVXosvS",
        "query": query,
        "pageSize": 10  # Get up to 10 results
    }
    
    try:
        response = requests.get(api_url, params=params)
        data = response.json()
        
        results = []
        for food in data.get('foods', []):
            # Get nutrients
            nutrients = {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0}
            for nutrient in food.get('foodNutrients', []):
                name = nutrient.get('nutrientName', '')
                value = nutrient.get('value', 0)
                if 'Energy' in name:
                    nutrients['calories'] = value
                elif 'Protein' in name:
                    nutrients['protein'] = value
                elif 'Carbohydrate' in name:
                    nutrients['carbs'] = value
                elif 'Total lipid' in name:
                    nutrients['fat'] = value
            
            results.append({
                "name": food.get('description', query),
                "calories": round(nutrients['calories'], 1),
                "protein": round(nutrients['protein'], 1),
                "carbs": round(nutrients['carbs'], 1),
                "fat": round(nutrients['fat'], 1)
            })
        
        return jsonify(results)
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify([]), 500

# ===== ADD MEAL =====
@app.route('/api/add-meal', methods=['POST'])
def add_meal():
    data = request.json
    email = data.get('email')
    meal_type = data.get('meal_type')
    food_name = data.get('food_name')
    calories = data.get('calories', 0)
    protein = data.get('protein', 0)
    carbs = data.get('carbs', 0)
    fat = data.get('fat', 0)
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO meals (user_email, meal_type, food_name, calories, protein, carbs, fat)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (email, meal_type, food_name, calories, protein, carbs, fat))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Meal added!"})

# ===== GET TODAY'S MEALS =====
@app.route('/api/get-meals', methods=['GET'])
def get_meals():
    email = request.args.get('email')
    meal_type = request.args.get('type')
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    if meal_type:
        cursor.execute('''
            SELECT food_name, calories, protein, carbs, fat FROM meals 
            WHERE user_email = ? AND meal_type = ? AND date = DATE('now')
        ''', (email, meal_type))
        meals = cursor.fetchall()
        conn.close()
        return jsonify([{"name": m[0], "calories": m[1], "protein": m[2], "carbs": m[3], "fat": m[4]} for m in meals])
    else:
        cursor.execute('''
            SELECT food_name, calories, protein, carbs, fat, meal_type FROM meals 
            WHERE user_email = ? AND date = DATE('now')
        ''', (email,))
        meals = cursor.fetchall()
        conn.close()
        
        result = {"breakfast": [], "lunch": [], "dinner": []}
        for m in meals:
            result[m[5]].append({"name": m[0], "calories": m[1], "protein": m[2], "carbs": m[3], "fat": m[4]})
        return jsonify(result)

# ===== UPDATE WATER INTAKE =====
@app.route('/api/update-water', methods=['POST'])
def update_water():
    data = request.json
    email = data.get('email')
    glasses = data.get('glasses')
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO water_intake (user_email, glasses, date)
        VALUES (?, ?, DATE('now'))
    ''', (email, glasses))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

# ===== GET WATER INTAKE =====
@app.route('/api/get-water', methods=['GET'])
def get_water():
    email = request.args.get('email')
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT glasses FROM water_intake 
        WHERE user_email = ? AND date = DATE('now')
    ''', (email,))
    
    result = cursor.fetchone()
    conn.close()
    
    glasses = result[0] if result else 0
    return jsonify({"glasses": glasses})

# ===== GET USER'S CALORIE HISTORY =====
@app.route('/api/calorie-history', methods=['GET'])
def get_calorie_history():
    email = request.args.get('email')
    days = int(request.args.get('days', 7))
    
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    # Get ALL meals for this user
    cursor.execute('''
        SELECT date, SUM(calories) as total 
        FROM meals 
        WHERE user_email = ? 
        GROUP BY date
        ORDER BY date DESC
    ''', (email,))
    
    rows = cursor.fetchall()
    conn.close()
    
    # Calculate total calories and days
    total_calories = 0
    days_with_data = 0
    
    for row in rows:
        total_calories += row[1]
        days_with_data += 1
        print(f"Date: {row[0]}, Calories: {row[1]}")
    
    avg = total_calories / days_with_data if days_with_data > 0 else 0
    
    # For the chart, create simple array
    chart_data = []
    for i in range(days):
        chart_data.append(0)
    
    # Fill with recent data
    for i in range(min(days_with_data, days)):
        chart_data[days - 1 - i] = rows[i][1] if i < len(rows) else 0
    
    return jsonify({
        "average": avg,
        "total": total_calories,
        "days_with_data": days_with_data,
        "calories": chart_data
    })

# ===== GET USER'S DAILY GOAL =====
@app.route('/api/user-goal', methods=['GET'])
def get_user_goal():
    email = request.args.get('email')
    
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    # Try to get target_calories from user_details
    try:
        cursor.execute('''
            SELECT target_calories FROM user_details WHERE user_email = ?
        ''', (email,))
        row = cursor.fetchone()
        goal = row[0] if row and row[0] else 2000
    except:
        # If column doesn't exist, use default
        goal = 2000
    
    conn.close()
    
    return jsonify({"goal": goal})

# ===== SETTINGS APIS =====

@app.route('/api/save-preferences', methods=['POST'])
def save_preferences():
    data = request.json
    email = data.get('email')
    email_pref = data.get('email_pref', 1)
    notifications = data.get('notifications', 1)
    units = data.get('units', 'kcal')
    visibility = data.get('visibility', 'private')
    
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            user_email TEXT PRIMARY KEY,
            email_pref INTEGER DEFAULT 1,
            notifications INTEGER DEFAULT 1,
            units TEXT DEFAULT 'kcal',
            visibility TEXT DEFAULT 'private'
        )
    ''')
    
    cursor.execute('''
        INSERT OR REPLACE INTO user_preferences (user_email, email_pref, notifications, units, visibility)
        VALUES (?, ?, ?, ?, ?)
    ''', (email, email_pref, notifications, units, visibility))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Preferences saved!"})

@app.route('/api/get-preferences', methods=['GET'])
def get_preferences():
    email = request.args.get('email')
    
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT email_pref, notifications, units, visibility 
        FROM user_preferences 
        WHERE user_email = ?
    ''', (email,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return jsonify({
            "email_pref": bool(row[0]),
            "notifications": bool(row[1]),
            "units": row[2],
            "visibility": row[3]
        })
    else:
        return jsonify({
            "email_pref": True,
            "notifications": True,
            "units": "kcal",
            "visibility": "private"
        })

@app.route('/api/change-password', methods=['POST'])
def change_password():
    data = request.json
    email = data.get('email')
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not email:
        return jsonify({"success": False, "message": "Email required"}), 400
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT password FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return jsonify({"success": False, "message": "User not found"})
    
    if row[0] != old_password:
        conn.close()
        return jsonify({"success": False, "message": "Current password is incorrect"})
    
    cursor.execute("UPDATE users SET password = ? WHERE email = ?", (new_password, email))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Password changed successfully!"})

@app.route('/api/delete-account', methods=['DELETE'])
def delete_account():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"success": False, "message": "Email required"}), 400
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM meals WHERE user_email = ?", (email,))
    cursor.execute("DELETE FROM user_details WHERE user_email = ?", (email,))
    cursor.execute("DELETE FROM user_preferences WHERE user_email = ?", (email,))
    cursor.execute("DELETE FROM water_intake WHERE user_email = ?", (email,))
    cursor.execute("DELETE FROM users WHERE email = ?", (email,))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Account deleted successfully"})

# ===== GET PROFILE =====
@app.route('/api/get-profile', methods=['GET'])
def get_profile():
    email = request.args.get('email')
    
    if not email:
        return jsonify({"success": False, "message": "Email required"}), 400
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    # Get user info
    cursor.execute("SELECT fullname, email, created_at FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    # Get user details
    cursor.execute('''
        SELECT username, age, gender, height, current_weight 
        FROM user_details WHERE user_email = ?
    ''', (email,))
    
    details = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            "success": True,
            "fullname": user[0],
            "email": user[1],
            "created_at": user[2],
            "username": details[0] if details else "",
            "age": details[1] if details else "",
            "gender": details[2] if details else "male",
            "height": details[3] if details else "",
            "weight": details[4] if details else ""
        })
    else:
        return jsonify({"success": False, "message": "User not found"}), 404

# ===== UPDATE PROFILE =====
@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    data = request.json
    email = data.get('email')
    fullname = data.get('fullname')
    age = data.get('age')
    gender = data.get('gender')
    height = data.get('height')
    weight = data.get('weight')
    username = data.get('username')
    
    if not email:
        return jsonify({"success": False, "message": "Email required"}), 400
    
    conn = sqlite3.connect('mealmentor.db')
    cursor = conn.cursor()
    
    # Update users table
    cursor.execute("UPDATE users SET fullname = ? WHERE email = ?", (fullname, email))
    
    # Check if user_details exists
    cursor.execute("SELECT * FROM user_details WHERE user_email = ?", (email,))
    exists = cursor.fetchone()
    
    if exists:
        cursor.execute('''
            UPDATE user_details 
            SET username = ?, age = ?, gender = ?, height = ?, current_weight = ?
            WHERE user_email = ?
        ''', (username, age, gender, height, weight, email))
    else:
        cursor.execute('''
            INSERT INTO user_details (user_email, username, age, gender, height, current_weight)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (email, username, age, gender, height, weight))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Profile updated!"})

# ===== HOME ROUTE =====
@app.route('/')
def home():
    return jsonify({"message": "MealMentor API is running!"})



if __name__ == '__main__':
    setup_database()
    print("🚀 MealMentor Backend Starting...")
    print("📍 API URL: http://127.0.0.1:5000")
    app.run(debug=True)