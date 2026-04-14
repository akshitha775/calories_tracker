async function register() {
    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("emailaddress").value;
    const password = document.getElementById("password").value;
    const confirmpassword = document.getElementById("confirmpassword").value;

    var nameError = document.getElementById("nameError");
    var emailError = document.getElementById("emailError");
    var passError = document.getElementById("passError");
    var confirmError = document.getElementById("confirmError");
    
    nameError.innerHTML = "";
    emailError.innerHTML = "";
    passError.innerHTML = "";
    confirmError.innerHTML = "";

    if (fullname === "") {
        nameError.innerHTML = "Full Name is required";
        return;
    }

    if (email === "") {
        emailError.innerHTML = "Email Address is required";
        return;
    }

    if (password === "") {
        passError.innerHTML = "Password is required";
        return;
    }

    if (confirmpassword === "") {
        confirmError.innerHTML = "Confirm your password";
        return;
    }
    
    if (!email.includes("@") || !email.includes(".")) {
        emailError.innerHTML = "Enter valid email address";
        return;
    }
    
    if (password !== confirmpassword) {
        confirmError.innerHTML = "Passwords do not match";
        return;
    }

    passError.innerHTML = "⏳ Creating account...";
    passError.style.color = "orange";

    try {
        const response = await fetch('http://127.0.0.1:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullname: fullname,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.success === true) {
            localStorage.setItem("userEmail", email);
            alert("1. Success! Message: " + data.message);
            alert("2. About to redirect to details.html");
            window.location.href = "details.html";
            alert("3. Redirect command executed");
        } else {
            if (data.message.includes("Email")) {
            emailError.innerHTML = data.message;
         } else {
              passError.innerHTML = data.message;
              passError.style.color = "red";
           }
        }

    } catch (error) {
        console.error("Error:", error);
        passError.innerHTML = "❌ Cannot connect to backend. Make sure Flask is running!";
        passError.style.color = "red";
    }
}