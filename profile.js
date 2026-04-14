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

// ===== PROFILE DROPDOWN NAVIGATION =====
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
    var confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
        localStorage.clear();
        window.location.href = 'login_pg.html';
    }
}

// ===== LOAD PROFILE FROM BACKEND =====
async function loadProfile() {
    var email = localStorage.getItem("userEmail");
    if (!email) {
        console.log("No user logged in");
        return;
    }
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/get-profile?email=${email}`);
        const data = await response.json();
        
        if (data.success) {
            // Set form values
            document.getElementById('fullName').value = data.fullname || '';
            document.getElementById('age').value = data.age || '';
            document.getElementById('gender').value = data.gender || 'male';
            document.getElementById('height').value = data.height || '';
            document.getElementById('weight').value = data.weight || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('username').value = data.username || '';
            
            // Update display name
            document.getElementById('profileDisplayName').innerHTML = data.fullname || 'User';
            document.getElementById('dropdownName').innerHTML = data.fullname || 'User';
            document.getElementById('dropdownEmail').innerHTML = data.email || '';
            
            // Update member since
            if (data.created_at) {
                var date = new Date(data.created_at);
                var year = date.getFullYear();
                document.getElementById('memberSince').innerHTML = `Member since ${year}`;
            }
        }
        
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

// ===== SAVE PROFILE TO BACKEND =====
async function saveProfile() {
    var email = localStorage.getItem("userEmail");
    if (!email) {
        alert("Please login first");
        window.location.href = "login_pg.html";
        return;
    }
    
    // Get all values
    var fullName = document.getElementById('fullName').value;
    var age = document.getElementById('age').value;
    var gender = document.getElementById('gender').value;
    var height = document.getElementById('height').value;
    var weight = document.getElementById('weight').value;
    var username = document.getElementById('username').value;
    
    if (!fullName) {
        alert("Full Name is required");
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5000/api/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                fullname: fullName,
                age: age,
                gender: gender,
                height: height,
                weight: weight,
                username: username
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update display name
            document.getElementById('profileDisplayName').innerHTML = fullName;
            document.getElementById('dropdownName').innerHTML = fullName;
            
            // Make inputs readonly again
            var inputs = document.querySelectorAll('.info-input');
            for (var i = 0; i < inputs.length; i++) {
                inputs[i].setAttribute('readonly', true);
                inputs[i].style.background = 'rgba(240,240,240,0.5)';
            }
            
            // Disable gender select
            document.getElementById('gender').disabled = true;
            
            alert('✅ Profile saved successfully!');
        } else {
            alert('Error: ' + data.message);
        }
        
    } catch (error) {
        console.error("Error saving profile:", error);
        alert("Cannot connect to backend. Make sure Flask is running!");
    }
}

// ===== EDIT PROFILE =====
function editProfile() {
    var inputs = document.querySelectorAll('.info-input');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].removeAttribute('readonly');
        inputs[i].style.background = 'white';
    }
    
    document.getElementById('gender').disabled = false;
    alert('You can now edit your profile');
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
    // Make inputs readonly initially
    var inputs = document.querySelectorAll('.info-input');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].setAttribute('readonly', true);
    }
    
    document.getElementById('gender').disabled = true;
    
    // Load profile data
    loadProfile();
};