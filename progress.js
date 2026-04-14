// ===== GET LOGGED IN USER =====
var userEmail = localStorage.getItem("userEmail");

// ===== MENU FUNCTIONS =====
function toggleMenu() {
    var sidebar = document.getElementById('menuSidebar');
    var overlay = document.getElementById('menuOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function toggleProfileDropdown() {
    var dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('active');
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
    var confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
        localStorage.clear();
        window.location.href = 'login_pg.html';
    }
}

// ===== LOAD REAL DATA FROM BACKEND =====
async function loadRealData(days) {
    if (!userEmail) {
        console.log("No user logged in");
        return null;
    }
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/calorie-history?email=${userEmail}&days=${days}`);
        const data = await response.json();
        
        console.log("API Response:", data);
        
        // Make sure we return calories array
        return {
            calories: data.calories || [],  // This should be [0,0,0,0,0,0,1293]
            average: data.average || 0
        };
        
    } catch (error) {
        console.error("Error loading data:", error);
        return null;
    }
}

async function loadUserGoal() {
    if (!userEmail) return 2000;
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/user-goal?email=${userEmail}`);
        const data = await response.json();
        return data.goal;
    } catch (error) {
        console.error("Error loading goal:", error);
        return 2000;
    }
}

// ===== DATE RANGE BUTTONS =====
function setDateRange(range) {
    var buttons = document.querySelectorAll('.range-btn');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
    }
    event.target.classList.add('active');
    
    var label = '';
    if (range === '7days') {
        label = 'Last 7 Days';
        show7DaysData();
    } else if (range === '30days') {
        label = 'Last 30 Days';
        show30DaysData();
    }
    
    document.getElementById('dateRangeLabel').innerHTML = label;
}

// ===== 7 DAYS DATA =====
async function show7DaysData() {
    var result = await loadRealData(7);
    var chartData = [];
    var avg = 0;
    
    // Check if result exists and has calories
    if (result && result.calories && result.calories.length > 0) {
        chartData = result.calories;
        avg = result.average;
        console.log("✅ Using REAL data - Avg:", avg);
        console.log("Chart Data:", chartData);
    } else {
        // Fallback sample data
        chartData = [1850, 2100, 1950, 2200, 2050, 2150, 1900];
        avg = Math.round(chartData.reduce((a,b) => a + b, 0) / chartData.length);
        console.log("⚠️ Using FALLBACK data - Avg:", avg);
    }
    
    var chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    if (window.myChart) {
        window.myChart.destroy();
    }
    
    var ctx = document.getElementById('calorieChart').getContext('2d');
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Calories',
                data: chartData,
                borderColor: '#2d5a4b',
                backgroundColor: 'rgba(45, 90, 75, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#4cb57c',
                pointBorderColor: 'white',
                pointRadius: 4,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' cal';
                        }
                    }
                }
            }
        }
    });
    
    document.getElementById('chartXAxis').innerHTML = 
        '<span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>';
    
    var goal = await loadUserGoal();
    updateStatsWithGoal(avg, goal);
}
// ===== 30 DAYS DATA =====
async function show30DaysData() {
    var result = await loadRealData(30);
    var chartData = [];
    
    if (result && result.calories && result.calories.length > 0) {
        chartData = result.calories;
    } else {
        // Fallback sample data
        chartData = [
            1850, 2100, 1950, 2200, 2050, 2150, 1900,
            2050, 2250, 2100, 1950, 1850, 2200, 2050,
            2150, 1900, 2100, 2250, 2050, 1950, 2150,
            2200, 2050, 1900, 2100, 2150, 2050, 1950,
            2200, 2100
        ];
    }
    
    var chartLabels = [];
    for (var i = 1; i <= 30; i++) {
        chartLabels.push(i.toString());
    }
    
    if (window.myChart) {
        window.myChart.destroy();
    }
    
    var ctx = document.getElementById('calorieChart').getContext('2d');
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Calories',
                data: chartData,
                borderColor: '#2d5a4b',
                backgroundColor: 'rgba(45, 90, 75, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#4cb57c',
                pointBorderColor: 'white',
                pointRadius: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' cal';
                        }
                    }
                }
            }
        }
    });
    
    var axisHtml = '';
    for (var j = 1; j <= 30; j += 5) {
        axisHtml += '<span>' + j + '</span>';
    }
    document.getElementById('chartXAxis').innerHTML = axisHtml;
    
    var goal = await loadUserGoal();
    var avg = 0;
    for (var i = 0; i < chartData.length; i++) {
        avg += chartData[i];
    }
    avg = Math.round(avg / chartData.length);
    
    updateStatsWithGoal(avg, goal);
}

// ===== UPDATE STATS WITH GOAL =====
function updateStatsWithGoal(avg, goal) {
    document.getElementById('dailyGoal').innerHTML = goal.toLocaleString() + ' cal';
    document.getElementById('avgIntake').innerHTML = avg.toLocaleString() + ' cal';
    
    var statusElement = document.getElementById('status');
    if (avg >= goal) {
        statusElement.innerHTML = 'On Track';
        statusElement.style.background = 'linear-gradient(145deg, #4cb57c, #2cb137)';
    } else {
        statusElement.innerHTML = 'Below Goal';
        statusElement.style.background = 'linear-gradient(145deg, #ff9800, #f57c00)';
    }
    
    updateZoneIndicator(avg, goal);
}

// ===== UPDATE ZONE INDICATOR =====
function updateZoneIndicator(avg, goal) {
    var percent = (avg / goal) * 100;
    
    document.getElementById('zoneUnder').classList.remove('active');
    document.getElementById('zoneNear').classList.remove('active');
    document.getElementById('zoneOver').classList.remove('active');
    
    var zone = '';
    var color = '';
    
    if (percent < 85) {
        zone = 'Under Goal';
        color = '#4aa3ff';
        document.getElementById('zoneUnder').classList.add('active');
    } else if (percent <= 105) {
        zone = 'Near Goal';
        color = '#4cb57c';
        document.getElementById('zoneNear').classList.add('active');
    } else {
        zone = 'Over Goal';
        color = '#ff9800';
        document.getElementById('zoneOver').classList.add('active');
    }
    
    document.getElementById('zoneAvgDisplay').innerHTML = avg.toLocaleString() + ' cal';
    document.getElementById('statusText').innerHTML = zone;
    document.getElementById('statusDot').style.background = color;
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
window.onload = async function() {
    await show7DaysData();
};