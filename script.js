
const API_URL = "https://s084y4k0bj.execute-api.us-east-1.amazonaws.com/auth";

const form = document.getElementById("form");
const message = document.getElementById("message");

async function trySignup() {
    try {
        message.innerHTML = "Signing up...";

        const username = document.getElementById("user").value;
        const password = document.getElementById("pass").value;

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password, action: "SIGNUP" })
        });

        const data = await response.json();

        if (response.status === 201) {
            message.innerHTML = "Signup successful! Redirecting to dashboard...";
            
            clearLocalStorage();
            localStorage.setItem("currentUser", username);
            localStorage.setItem("numStrings", 0);

            localStorage.setItem("timesLoggedOn", 1);
            localStorage.setItem("totalAdded", 0);
            localStorage.setItem("totalDeleted", 0);
            localStorage.setItem("stringCapacity", 16);
            localStorage.setItem("title", data.user.title);
            localStorage.setItem("achievements", JSON.stringify(data.user.achievements));
            
            localStorage.setItem("userPFP", "");
            
            setTimeout(() => {
                form.reset();
                window.location.href = "dashboard.html"; 
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
        message.innerHTML = "Logging in...";

        const username = document.getElementById("user").value;
        const password = document.getElementById("pass").value;

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password, action: "LOGIN" })
        });

        const data = await response.json();

        if (response.status === 200) {
            message.innerHTML = "Login successful! Redirecting to dashboard...";
            
            clearLocalStorage();
            localStorage.setItem("currentUser", username);

            const strings = data.user.strings;
            const numStrings = data.user.numStrings;
            localStorage.setItem("userStrings", JSON.stringify(strings));
            localStorage.setItem("numStrings", numStrings ?? 0);

            localStorage.setItem("timesLoggedOn", data.user.timesLoggedOn ?? 2);
            localStorage.setItem("totalAdded", data.user.totalAdded ?? 0);
            localStorage.setItem("totalDeleted", data.user.totalDeleted ?? 0);
            localStorage.setItem("stringCapacity", data.user.stringCapacity ?? 16);
            localStorage.setItem("title", data.user.title);
            localStorage.setItem("achievements", JSON.stringify(data.user.achievements));

            localStorage.setItem("userPFP", data.user.pfpUrl || "");

            
            setTimeout(() => {
                form.reset();
                window.location.href = "dashboard.html"; 
            }, 1000);

        
        } 
        else if (response.status === 400) {
            message.innerHTML = "Invalid inputs...";
        }
        else if (response.status === 401) {
            message.innerHTML = "User doesn't exist!";
        }
        else if (response.status === 402) {
            message.innerHTML = "Incorrect password...";
        }
        else {
            message.innerHTML = "Login failed for some reason or other.";
        }

    } catch (error) {
        console.error("Network Error:", error);
        message.innerHTML = "An error occurred.";
    }
}

function clearLocalStorage() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userStrings");
    localStorage.removeItem("numStrings");

    localStorage.removeItem("timesLoggedOn");
    localStorage.removeItem("totalDeleted");
    localStorage.removeItem("totalAdded");
    localStorage.removeItem("stringCapacity");
    localStorage.removeItem("title");
    localStorage.removeItem("achievements");
}

function redisplayWelcome() {
    message.innerHTML = "Welcome!";
}

window.onload = redisplayWelcome();