async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    var emailError = document.getElementById("emailError");
    var passError = document.getElementById("passError");

    emailError.innerHTML = "";
    passError.innerHTML = "";

    if (email == "") {
        emailError.innerHTML = "Email is required";
        return;
    }
    
    if (password == "") {
        passError.innerHTML = "Password is required";
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("userEmail", data.email);
            localStorage.setItem("userName", data.fullname);
            alert("Welcome " + data.fullname + "!");
            window.location.href = "home_pg.html";
        } else {
            if (data.message.includes("Email")) {
                emailError.innerHTML = data.message;
            } else {
                passError.innerHTML = data.message;
            }
        }

    } catch (error) {
        console.error("Error:", error);
        passError.innerHTML = "❌ Cannot connect to backend. Make sure Flask is running!";
    }
}

function goToRegister() {
    window.location.href = "account_pg.html";
}