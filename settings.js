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

function logout() {
    var confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
        localStorage.clear();
        window.location.href = 'login_pg.html';
    }
}

// ===== PROFILE DROPDOWN NAVIGATION =====
function navigateToProfile() {
    toggleProfileDropdown();
    window.location.href = 'profile.html';
}

function navigateToAccount() {
    toggleProfileDropdown();
    window.location.href = 'settings.html';
}

// ===== THEME FUNCTIONS =====
function setTheme(theme) {
    var lightBtn = document.getElementById('lightThemeBtn');
    var darkBtn = document.getElementById('darkThemeBtn');
    
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        if (lightBtn && darkBtn) {
            lightBtn.classList.remove('active');
            darkBtn.classList.add('active');
        }
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        if (lightBtn && darkBtn) {
            lightBtn.classList.add('active');
            darkBtn.classList.remove('active');
        }
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    var savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        setTheme('dark');
    } else {
        setTheme('light');
    }
}

// ===== LOAD PREFERENCES FROM BACKEND =====
async function loadPreferences() {
    var email = localStorage.getItem("userEmail");
    if (!email) return;
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/get-preferences?email=${email}`);
        const prefs = await response.json();
        
        document.getElementById('emailPref').checked = prefs.email_pref;
        document.getElementById('notifications').checked = prefs.notifications;
        document.getElementById('units').value = prefs.units;
        document.getElementById('visibility').value = prefs.visibility;
        
    } catch (error) {
        console.error("Error loading preferences:", error);
    }
}

// ===== SAVE SETTINGS TO BACKEND =====
async function saveSettings() {
    var email = localStorage.getItem("userEmail");
    
    if (!email) {
        alert("Please login first");
        window.location.href = "login_pg.html";
        return;
    }
    
    var emailPref = document.getElementById('emailPref').checked ? 1 : 0;
    var notifications = document.getElementById('notifications').checked ? 1 : 0;
    var units = document.getElementById('units').value;
    var visibility = document.getElementById('visibility').value;
    
    try {
        const response = await fetch('http://127.0.0.1:5000/api/save-preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                email_pref: emailPref,
                notifications: notifications,
                units: units,
                visibility: visibility
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Settings saved successfully!');
        } else {
            alert('Error saving settings');
        }
        
    } catch (error) {
        console.error("Error saving settings:", error);
        alert("Cannot connect to backend. Make sure Flask is running!");
    }
}

// ===== CHANGE PASSWORD =====
async function changePassword() {
    var email = localStorage.getItem("userEmail");
    if (!email) {
        alert("Please login first");
        return;
    }
    
    var oldPassword = prompt("Enter current password:");
    if (!oldPassword) return;
    
    var newPassword = prompt("Enter new password:");
    if (!newPassword) return;
    
    var confirmPassword = prompt("Confirm new password:");
    if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5000/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                old_password: oldPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        alert(data.message);
        
    } catch (error) {
        console.error("Error changing password:", error);
        alert("Cannot connect to backend");
    }
}

// ===== DELETE ACCOUNT =====
async function deleteAccount() {
    var email = localStorage.getItem("userEmail");
    if (!email) {
        alert("No user logged in");
        return;
    }
    
    var confirmDelete = confirm('⚠️ Are you sure you want to delete your account? This cannot be undone!');
    if (!confirmDelete) return;
    
    var confirmAgain = confirm('This is permanent. All your data will be lost. Continue?');
    if (!confirmAgain) return;
    
    try {
        const response = await fetch('http://127.0.0.1:5000/api/delete-account', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        
        const data = await response.json();
        alert(data.message);
        
        if (data.success === true) {
            // Clear all local storage
            localStorage.clear();
            // Force redirect to login page
            window.location.replace("login_pg.html");
        }
        
    } catch (error) {
        console.error("Error deleting account:", error);
        alert("Cannot connect to backend. Make sure Flask is running!");
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

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    loadPreferences();
});