
const SIGNUP_LOGIN_API_URL = "https://s084y4k0bj.execute-api.us-east-1.amazonaws.com/auth";

const form = document.getElementById("form");
const message = document.getElementById("message");

async function trySignup() {
    try {
        const username = document.getElementById("user").value;
        const password = document.getElementById("pass").value;

        const response = await fetch(SIGNUP_LOGIN_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password, action: "SIGNUP" })
        });

        const data = await response.json();

        if (response.status === 201) {
            message.innerHTML = "Signup successful! Redirecting to dashboard in 3...";
            
            localStorage.setItem("currentUser", username);
            
            setTimeout(() => {
                form.reset();
                message.innerHTML = "";
                window.location.href = "dashboard.html"; 
            }, 3000);

            setTimeout(() => {
                message.innerHTML = "Signup successful! Redirecting to dashboard in 1...";
            }, 2000);

            setTimeout(() => {
                message.innerHTML = "Signup successful! Redirecting to dashboard in 2...";
            }, 1000);
        
        } 
        else if (response.status === 409) {
            message.innerHTML = "Username already taken...";
        }
        else if (response.status === 400) {
            message.innerHTML = "Invalid inputs...";
        }
        else {
            message.innerHTML = "Signup failed for some reason or other.";
        }

    } catch (error) {
        console.error("Network Error:", error);
        message.innerHTML = "An error occurred.";
    }

}

async function tryLogin() {
    try {
        const username = document.getElementById("user").value;
        const password = document.getElementById("pass").value;

        const response = await fetch(SIGNUP_LOGIN_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password, action: "LOGIN" })
        });

        const data = await response.json();

        if (response.status === 200) {
            message.innerHTML = "Login successful! Redirecting to dashboard in 3...";
            
            localStorage.setItem("currentUser", username);

            const strings = data.user.strings;
            const numStrings = data.user.numStrings;
            localStorage.setItem("userStrings", JSON.stringify(strings));
            localStorage.setItem("numStrings", numStrings ?? 0);
            
            setTimeout(() => {
                form.reset();
                message.innerHTML = "";
                window.location.href = "dashboard.html"; 
            }, 3000);

            setTimeout(() => {
                message.innerHTML = "Login successful! Redirecting to dashboard in 1...";
            }, 2000);

            setTimeout(() => {
                message.innerHTML = "Login successful! Redirecting to dashboard in 2...";
            }, 1000);
        
        } 
        else if (response.status === 400) {
            message.innerHTML = "Invalid inputs...";
        }
        else {
            message.innerHTML = "Login failed for some reason or other.";
        }

    } catch (error) {
        console.error("Network Error:", error);
        message.innerHTML = "An error occurred.";
    }
}

// function clearLocalStorage() {
//     localStorage.removeItem("currentUser");
//     localStorage.removeItem("userStrings");
//     localStorage.removeItem("numStrings");
// }

// window.onload = clearLocalStorage;