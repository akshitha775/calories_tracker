// ===== DATA STORAGE =====
var meals = {
    breakfast: { items: [], total: 0 },
    lunch: { items: [], total: 0 },
    dinner: { items: [], total: 0 }
};

var recentFoods = []; // Stores recently added foods (max 5)
var currentMeal = 'dinner';

// Get logged in user email
var userEmail = localStorage.getItem("userEmail");

// ===== LOAD SAVED MEALS FROM BACKEND =====
async function loadSavedMeals() {
    if (!userEmail) return;
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/get-meals?email=${userEmail}`);
        const data = await response.json();
        
        // Reset meals
        meals = {
            breakfast: { items: [], total: 0 },
            lunch: { items: [], total: 0 },
            dinner: { items: [], total: 0 }
        };
        
        // Load breakfast
        if (data.breakfast) {
            for (var i = 0; i < data.breakfast.length; i++) {
                var item = data.breakfast[i];
                meals.breakfast.items.push(item);
                meals.breakfast.total += item.calories;
            }
        }
        
        // Load lunch
        if (data.lunch) {
            for (var i = 0; i < data.lunch.length; i++) {
                var item = data.lunch[i];
                meals.lunch.items.push(item);
                meals.lunch.total += item.calories;
            }
        }
        
        // Load dinner
        if (data.dinner) {
            for (var i = 0; i < data.dinner.length; i++) {
                var item = data.dinner[i];
                meals.dinner.items.push(item);
                meals.dinner.total += item.calories;
            }
        }
        
        updateMealDisplay();
        
    } catch (error) {
        console.error("Error loading meals:", error);
    }
}

// ===== MENU FUNCTIONS =====
function toggleMenu() {
    document.getElementById('menuSidebar').classList.toggle('active');
    document.getElementById('menuOverlay').classList.toggle('active');
}

function toggleProfileDropdown() {
    document.getElementById('profileDropdown').classList.toggle('active');
}

function navigateTo(page) {
    toggleMenu();
    if (page === 'home') window.location.href = 'home_pg.html';
    else if (page === 'logfood') window.location.href = 'log_food.html';
    else if (page === 'progress') window.location.href = 'progress.html';
    else if (page === 'settings') window.location.href = 'settings.html';
}

function navigateToProfile() {
    toggleProfileDropdown();
    window.location.href = 'profile.html';
}

function navigateToAccount() {
    toggleProfileDropdown();
    window.location.href = 'settings.html';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'login_pg.html';
    }
}

// ===== MEAL SELECTION =====
function selectMeal(meal) {
    currentMeal = meal;
    var mealDisplay = {
        'breakfast': 'Breakfast',
        'lunch': 'Lunch',
        'dinner': 'Dinner'
    };
    document.getElementById('selectedMealName').innerHTML = mealDisplay[meal];
}

// ===== SEARCH FOOD USING USDA API =====
async function searchFood() {
    var searchTerm = document.getElementById('foodSearch').value;
    
    if (searchTerm === '') {
        alert('Please enter a food name');
        return;
    }
    
    var resultsDiv = document.getElementById('searchResults');
    var resultsList = document.getElementById('resultsList');
    
    resultsDiv.style.display = 'block';
    resultsList.innerHTML = '<p style="text-align:center;">🔍 Searching...</p>';
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/search-food?q=${encodeURIComponent(searchTerm)}`);
        const foods = await response.json();
        
        if (foods.length === 0) {
            resultsList.innerHTML = '<p style="text-align:center; color:#666;">No foods found. Try: chicken, rice, egg, apple</p>';
            return;
        }
        
        resultsList.innerHTML = '';
        for (var i = 0; i < foods.length; i++) {
            var food = foods[i];
            resultsList.innerHTML += 
                '<div class="food-item-row">' +
                '<div class="food-info">' +
                '<span class="food-item-name">' + food.name + '</span>' +
                '<div class="food-nutrients">' +
                '<span class="nutrient">🔥 ' + food.calories + ' cal</span>' +
                '<span class="nutrient">💪 ' + food.protein + 'g</span>' +
                '<span class="nutrient">🍚 ' + food.carbs + 'g</span>' +
                '<span class="nutrient">🥑 ' + food.fat + 'g</span>' +
                '</div>' +
                '</div>' +
                '<button class="add-btn-small" onclick="addFood(\'' + food.name.replace(/'/g, "\\'") + '\', ' + food.calories + ', ' + food.protein + ', ' + food.carbs + ', ' + food.fat + ')">+</button>' +
                '</div>';
        }
        
    } catch (error) {
        console.error("Error:", error);
        resultsList.innerHTML = '<p style="text-align:center; color:red;">❌ Cannot connect to backend</p>';
    }
}

// ===== ADD FOOD TO BACKEND =====
async function addFood(name, calories, protein = 0, carbs = 0, fat = 0) {
    if (!userEmail) {
        alert("Please login first");
        window.location.href = "login_pg.html";
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5000/api/add-meal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                meal_type: currentMeal,
                food_name: name,
                calories: calories,
                protein: protein,
                carbs: carbs,
                fat: fat
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Add to local meals object
            meals[currentMeal].items.push({
                name: name,
                calories: calories,
                protein: protein,
                carbs: carbs,
                fat: fat
            });
            meals[currentMeal].total += calories;
            
            // Add to recent foods
            addToRecent(name, calories);
            
            // Update display
            updateMealDisplay();
            updateRecentDisplay();
        }
        
    } catch (error) {
        console.error("Error adding meal:", error);
        alert("Failed to add meal");
    }
}

// ===== ADD TO RECENT (SAVES TO LOCALSTORAGE) =====
function addToRecent(name, calories) {
    // Get existing recent foods from localStorage
    var recent = localStorage.getItem("recentFoods");
    var recentFoods = recent ? JSON.parse(recent) : [];
    
    // Check if food already exists
    for (var i = 0; i < recentFoods.length; i++) {
        if (recentFoods[i].name === name) {
            recentFoods.splice(i, 1);
            break;
        }
    }
    
    // Add to beginning
    recentFoods.unshift({ name: name, cal: calories });
    
    // Keep only last 10
    if (recentFoods.length > 5) {
        recentFoods.pop();
    }
    
    // Save back to localStorage
    localStorage.setItem("recentFoods", JSON.stringify(recentFoods));
    
    // Update display
    updateRecentDisplay();
}

// ===== UPDATE RECENT DISPLAY =====
function updateRecentDisplay() {
    var recentList = document.getElementById('recentFoodsList');
    var recent = localStorage.getItem("recentFoods");
    var recentFoods = recent ? JSON.parse(recent) : [];
    
    if (recentFoods.length > 0) {
        var html = '';
        for (var i = 0; i < recentFoods.length; i++) {
            html += 
                '<button class="recent-food-btn" onclick="addFood(\'' + recentFoods[i].name + '\', ' + recentFoods[i].cal + ', 0, 0, 0)">' +
                '<span class="recent-food-name">' + recentFoods[i].name + '</span>' +
                '<span class="recent-food-cal">' + recentFoods[i].cal + ' cal</span>' +
                '</button>';
        }
        recentList.innerHTML = html;
    } else {
        recentList.innerHTML = '<p class="empty-message">No recent foods yet. Add some food to see them here!</p>';
    }
}

// ===== UPDATE MEAL DISPLAY =====
function updateMealDisplay() {
    updateMealSection('breakfast');
    updateMealSection('lunch');
    updateMealSection('dinner');
    
    var dailyTotal = meals.breakfast.total + meals.lunch.total + meals.dinner.total;
    document.getElementById('dailyTotal').innerHTML = dailyTotal + ' cal';
}

function updateMealSection(meal) {
    var container = document.getElementById(meal + 'Items');
    var totalSpan = document.getElementById(meal + 'Total');
    
    if (meals[meal].items.length > 0) {
        var html = '';
        for (var i = 0; i < meals[meal].items.length; i++) {
            html += 
                '<div class="food-item-row">' +
                '<span class="food-item-name">' + meals[meal].items[i].name + '</span>' +
                '<span class="food-item-cal">' + meals[meal].items[i].calories + ' cal</span>' +
                '</div>';
        }
        container.innerHTML = html;
    } else {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:10px;">No items added</p>';
    }
    
    totalSpan.innerHTML = meals[meal].total + ' cal';
}

// ===== CLOSE DROPDOWN =====
document.addEventListener('click', function(event) {
    var dropdown = document.getElementById('profileDropdown');
    var btn = document.querySelector('.button1');
    
    if (dropdown && btn) {
        if (!btn.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    }
});

// ===== INITIALIZE =====
window.onload = function() {
    loadSavedMeals();
    updateRecentDisplay();
};

