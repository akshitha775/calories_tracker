async function saveDetails() {
    const username = document.getElementById("username").value;
    const age = document.getElementById("age").value;
    const currentWeight = document.getElementById("currentweight").value;
    const targetWeight = document.getElementById("targetweight").value;
    const height = document.getElementById("height").value;
    const gender = document.getElementById("gender").value;

    if (!username || !age || !currentWeight || !targetWeight || !height || !gender) {
        alert("Please fill all fields!");
        return;
    }

    if (age <= 0 || age > 120) {
        alert("Please enter a valid age!");
        return;
    }

    if (currentWeight <= 0 || currentWeight > 300) {
        alert("Please enter a valid current weight!");
        return;
    }

    if (targetWeight <= 0 || targetWeight > 300) {
        alert("Please enter a valid target weight!");
        return;
    }

    if (height <= 0 || height > 300) {
        alert("Please enter a valid height!");
        return;
    }

    const email = localStorage.getItem("userEmail");
    
    if (!email) {
        alert("Session expired. Please register again.");
        window.location.href = "account_pg.html";
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/save-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                username: username,
                age: age,
                current_weight: currentWeight,
                target_weight: targetWeight,
                height: height,
                gender: gender
            })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = "login_pg.html";
        } else {
            alert("Error: " + data.message);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Cannot connect to backend. Make sure Flask is running!");
    }
} 