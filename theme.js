// ===== THEME FUNCTIONS - SHARED ACROSS ALL PAGES =====

// Apply theme based on saved preference
function applyTheme() {
    var savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// Toggle theme (for settings page)
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        
        // Update buttons if they exist on this page
        var lightBtn = document.getElementById('lightThemeBtn');
        var darkBtn = document.getElementById('darkThemeBtn');
        if (lightBtn && darkBtn) {
            lightBtn.classList.remove('active');
            darkBtn.classList.add('active');
        }
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        
        // Update buttons if they exist on this page
        var lightBtn = document.getElementById('lightThemeBtn');
        var darkBtn = document.getElementById('darkThemeBtn');
        if (lightBtn && darkBtn) {
            lightBtn.classList.add('active');
            darkBtn.classList.remove('active');
        }
    }
}

// Run applyTheme when page loads
document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
});