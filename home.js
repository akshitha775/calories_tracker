// ===== GET LOGGED IN USER =====
const userEmail = localStorage.getItem("userEmail");
const userName = localStorage.getItem("userName");

// Daily calorie goal
const DAILY_GOAL = 2000;

// ===== DISPLAY USER NAME & DATE =====
document.addEventListener('DOMContentLoaded', function() {
    // Display logged-in user name
    if (userName) {
        const welcomeTitle = document.querySelector('.welcome-title');
        if (welcomeTitle) {
            welcomeTitle.innerHTML = `Welcome back, ${userName}! 👋`;
        }
    }
    
    // Display current date
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = date.toLocaleDateString('en-US', options);
    }
    
    // Load all data
    loadTodayMeals();
    loadWaterIntake();
});

// ===== LOAD TODAY'S MEALS FROM BACKEND =====
async function loadTodayMeals() {
    if (!userEmail) {
        console.log("No user email found");
        return;
    }
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/get-meals?email=${userEmail}`);
        const meals = await response.json();
        
        // Calculate total calories
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        
        // Display breakfast items
        const breakfastList = document.getElementById('breakfastList');
        if (breakfastList) {
            breakfastList.innerHTML = '';
            if (meals.breakfast && meals.breakfast.length > 0) {
                meals.breakfast.forEach(meal => {
                    const p = document.createElement('p');
                    p.textContent = `${meal.name} - ${meal.calories} cal`;
                    breakfastList.appendChild(p);
                    totalCalories += meal.calories || 0;
                    totalProtein += meal.protein || 0;
                    totalCarbs += meal.carbs || 0;
                    totalFat += meal.fat || 0;
                });
            } else {
                breakfastList.innerHTML = '<p style="color:#999;">No items added</p>';
            }
        }
        
        // Display lunch items
        const lunchList = document.getElementById('lunchList');
        if (lunchList) {
            lunchList.innerHTML = '';
            if (meals.lunch && meals.lunch.length > 0) {
                meals.lunch.forEach(meal => {
                    const p = document.createElement('p');
                    p.textContent = `${meal.name} - ${meal.calories} cal`;
                    lunchList.appendChild(p);
                    totalCalories += meal.calories || 0;
                    totalProtein += meal.protein || 0;
                    totalCarbs += meal.carbs || 0;
                    totalFat += meal.fat || 0;
                });
            } else {
                lunchList.innerHTML = '<p style="color:#999;">No items added</p>';
            }
        }
        
        // Display dinner items
        const dinnerList = document.getElementById('dinnerList');
        if (dinnerList) {
            dinnerList.innerHTML = '';
            if (meals.dinner && meals.dinner.length > 0) {
                meals.dinner.forEach(meal => {
                    const p = document.createElement('p');
                    p.textContent = `${meal.name} - ${meal.calories} cal`;
                    dinnerList.appendChild(p);
                    totalCalories += meal.calories || 0;
                    totalProtein += meal.protein || 0;
                    totalCarbs += meal.carbs || 0;
                    totalFat += meal.fat || 0;
                });
            } else {
                dinnerList.innerHTML = '<p style="color:#999;">No items added</p>';
            }
        }
        
        // Update progress display
        updateProgress(totalCalories);
        updateNutritionSummary(totalCalories, totalProtein, totalCarbs, totalFat);
        
    } catch (error) {
        console.error("Error loading meals:", error);
    }
}

// ===== UPDATE PROGRESS BAR =====
function updateProgress(totalCalories) {
    const percentage = Math.min(Math.round((totalCalories / DAILY_GOAL) * 100), 100);
    const remaining = Math.max(DAILY_GOAL - totalCalories, 0);
    
    // Update progress bar
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    
    // Update percentage text
    const percentText = document.querySelector('.progress-number');
    if (percentText) {
        percentText.textContent = percentage + '%';
    }
    
    // Update remaining stat
    const remainingElements = document.querySelectorAll('.stat-value');
    if (remainingElements.length >= 3) {
        remainingElements[0].textContent = remaining + ' cal';
    }
}

// ===== UPDATE NUTRITION SUMMARY =====
function updateNutritionSummary(calories, protein, carbs, fat) {
    const totalCaloriesEl = document.getElementById('totalCalories');
    const totalProteinEl = document.getElementById('totalProtein');
    const totalCarbsEl = document.getElementById('totalCarbs');
    const totalFatEl = document.getElementById('totalFat');
    
    if (totalCaloriesEl) totalCaloriesEl.textContent = Math.round(calories) + ' cal';
    if (totalProteinEl) totalProteinEl.textContent = Math.round(protein) + 'g protein';
    if (totalCarbsEl) totalCarbsEl.textContent = Math.round(carbs) + 'g carbs';
    if (totalFatEl) totalFatEl.textContent = Math.round(fat) + 'g fats';
}

// ===== ADD MEAL =====
async function addMeal(mealType, foodName, calories, protein = 0, carbs = 0, fat = 0) {
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
                meal_type: mealType,
                food_name: foodName,
                calories: calories,
                protein: protein,
                carbs: carbs,
                fat: fat
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Refresh the display
            loadTodayMeals();
        }
    } catch (error) {
        console.error("Error adding meal:", error);
        alert("Failed to add meal. Make sure backend is running!");
    }
}

// ===== SAVE BREAKFAST (Shows all options) =====
async function saveBreakfast() {
    const foodName = document.getElementById('breakfastText').value;
    
    if (foodName === '') {
        alert('Please enter a food item');
        return;
    }
    
    const btn = event.target;
    btn.innerHTML = "🔍 Searching...";
    btn.disabled = true;
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/search-food?q=${encodeURIComponent(foodName)}`);
        const foods = await response.json();
        
        if (foods.length === 0) {
            alert(`No results found for "${foodName}"`);
            return;
        }
        
        // Show all options for user to choose
        let options = "Select a food:\n\n";
        for (let i = 0; i < foods.length; i++) {
            options += `${i + 1}. ${foods[i].name} - ${foods[i].calories} cal\n`;
        }
        
        const choice = prompt(options + "\n\nEnter number (1-" + foods.length + "):");
        const index = parseInt(choice) - 1;
        
        if (index >= 0 && index < foods.length) {
            const food = foods[index];
            await addMeal('breakfast', food.name, food.calories, food.protein, food.carbs, food.fat);
            alert(`✅ Added: ${food.name} - ${food.calories} cal`);
        } else {
            alert("No food selected");
        }
        
    } catch (error) {
        console.error("Error:", error);
        alert("Search failed. Please try again.");
    } finally {
        document.getElementById('breakfastText').value = '';
        document.getElementById('breakfastInput').style.display = 'none';
        btn.innerHTML = "+ Add Food";
        btn.disabled = false;
    }
}

// ===== SAVE LUNCH (Shows all options) =====
async function saveLunch() {
    const foodName = document.getElementById('lunchText').value;
    
    if (foodName === '') {
        alert('Please enter a food item');
        return;
    }
    
    const btn = event.target;
    btn.innerHTML = "🔍 Searching...";
    btn.disabled = true;
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/search-food?q=${encodeURIComponent(foodName)}`);
        const foods = await response.json();
        
        if (foods.length === 0) {
            alert(`No results found for "${foodName}"`);
            return;
        }
        
        // Show all options for user to choose
        let options = "Select a food:\n\n";
        for (let i = 0; i < foods.length; i++) {
            options += `${i + 1}. ${foods[i].name} - ${foods[i].calories} cal\n`;
        }
        
        const choice = prompt(options + "\n\nEnter number (1-" + foods.length + "):");
        const index = parseInt(choice) - 1;
        
        if (index >= 0 && index < foods.length) {
            const food = foods[index];
            await addMeal('lunch', food.name, food.calories, food.protein, food.carbs, food.fat);
            alert(`✅ Added: ${food.name} - ${food.calories} cal`);
        } else {
            alert("No food selected");
        }
        
    } catch (error) {
        console.error("Error:", error);
        alert("Search failed. Please try again.");
    } finally {
        document.getElementById('lunchText').value = '';
        document.getElementById('lunchInput').style.display = 'none';
        btn.innerHTML = "+ Add Food";
        btn.disabled = false;
    }
}

// ===== SAVE DINNER (Shows all options) =====
async function saveDinner() {
    const foodName = document.getElementById('dinnerText').value;
    
    if (foodName === '') {
        alert('Please enter a food item');
        return;
    }
    
    const btn = event.target;
    btn.innerHTML = "🔍 Searching...";
    btn.disabled = true;
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/search-food?q=${encodeURIComponent(foodName)}`);
        const foods = await response.json();
        
        if (foods.length === 0) {
            alert(`No results found for "${foodName}"`);
            return;
        }
        
        // Show all options for user to choose
        let options = "Select a food:\n\n";
        for (let i = 0; i < foods.length; i++) {
            options += `${i + 1}. ${foods[i].name} - ${foods[i].calories} cal\n`;
        }
        
        const choice = prompt(options + "\n\nEnter number (1-" + foods.length + "):");
        const index = parseInt(choice) - 1;
        
        if (index >= 0 && index < foods.length) {
            const food = foods[index];
            await addMeal('dinner', food.name, food.calories, food.protein, food.carbs, food.fat);
            alert(`✅ Added: ${food.name} - ${food.calories} cal`);
        } else {
            alert("No food selected");
        }
        
    } catch (error) {
        console.error("Error:", error);
        alert("Search failed. Please try again.");
    } finally {
        document.getElementById('dinnerText').value = '';
        document.getElementById('dinnerInput').style.display = 'none';
        btn.innerHTML = "+ Add Food";
        btn.disabled = false;
    }
}

// ===== SHOW INPUT FIELDS =====
function showBreakfastInput() {
    document.getElementById('breakfastInput').style.display = 'flex';
}

function showLunchInput() {
    document.getElementById('lunchInput').style.display = 'flex';
}

function showDinnerInput() {
    document.getElementById('dinnerInput').style.display = 'flex';
}

// ===== WATER INTAKE =====
async function updateWaterCount() {
    const checkboxes = document.querySelectorAll('.water-circles input');
    let count = 0;
    
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            count++;
        }
    }
    
    document.getElementById('waterCount').textContent = count + '/8';
    
    if (userEmail) {
        try {
            await fetch('http://127.0.0.1:5000/api/update-water', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, glasses: count })
            });
        } catch (error) {
            console.error("Error saving water:", error);
        }
    }
}

async function loadWaterIntake() {
    if (!userEmail) return;
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/get-water?email=${userEmail}`);
        const data = await response.json();
        
        const checkboxes = document.querySelectorAll('.water-circles input');
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = i < data.glasses;
        }
        
        document.getElementById('waterCount').textContent = data.glasses + '/8';
    } catch (error) {
        console.error("Error loading water:", error);
    }
}

// ===== MENU FUNCTIONS =====
function toggleMenu() {
    var sidebar = document.getElementById('menuSidebar');
    var overlay = document.getElementById('menuOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function toggleProfileDropdown() {
    var dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function navigateTo(page) {
    toggleMenu();
    if (page === 'home') {
        window.location.href = 'home_pg.html';
    } else if (page === 'logfood') {
        window.location.href = 'log_food.html';
    } else if (page === 'progress') {
        window.location.href = 'progress.html';
    } else if (page === 'settings') {
        window.location.href = 'settings.html';
    }
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
    toggleProfileDropdown();
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'login_pg.html';
    }
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