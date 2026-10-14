
const API_URL = "https://s084y4k0bj.execute-api.us-east-1.amazonaws.com/manage";

function initializeDashboard() {
    const currentUser = localStorage.getItem("currentUser");
    const numStrings = localStorage.getItem("numStrings");
    var userStrings = localStorage.getItem("userStrings");

    if (!currentUser || numStrings === null) {
        window.location.href = "index.html";
        return;
    }

    if (numStrings > 0) {
        userStrings = JSON.parse(localStorage.getItem("userStrings"));
    }
    else {
        userStrings = [];
    }

    const statusMsg = document.getElementById("status");
    statusMsg.innerHTML = `Welcome ${currentUser}! You have ${numStrings} strings stored.`;

    const stringsList = document.getElementById("strings");
    stringsList.innerHTML = "";
    
    if (numStrings == 0) {
        stringsList.innerHTML = "No Strings!";
        return;
    }

    for (let i = 0; i < numStrings; i++) {
        stringsList.innerHTML += `<li>${userStrings[i]} <button onclick="deleteString(${i})">Delete</button></li>`;
    }
}

function updateDashboard() {
    var userStrings = JSON.parse(localStorage.getItem("userStrings"));
    const numStrings = localStorage.getItem("numStrings");

    const stringsList = document.getElementById("strings");
    stringsList.innerHTML = "";

    if (numStrings == 0) {
        stringsList.innerHTML = "No Strings!";
        return;
    }

    for (let i = 0; i < numStrings; i++) {
        stringsList.innerHTML += `<li>${userStrings[i]} <button onclick="deleteString(${i})">Delete</button></li>`;
    }
}

async function addString() {
    const statusMsg = document.getElementById("status");

    try {
        const newString = document.getElementById("newString").value;
        const username = localStorage.getItem("currentUser");

        if (!newString) {
            statusMsg.innerHTML = "Fah! I won't deal with empty strings! Away with you!";
            return;
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, newString, action: "ADDSTRING" })
        });

        const data = await response.json();

        if (response.status === 200) {
            localStorage.setItem("userStrings", JSON.stringify(data.user.strings));
            localStorage.setItem("numStrings", data.user.numStrings);
            statusMsg.innerHTML = "String added successfully! You now have " + data.user.numStrings;
            updateDashboard();
        } 
        else if (response.status === 409) {
            statusMsg.innerHTML = "You already have that string! Do you really need another...";
        }

        else if (response.status === 410) {
            statusMsg.innerHTML = "You're at the max string count of " + localStorage.getItem("numStrings") + "! Delete some to add some.";
        }
        
        else {
            statusMsg.innerHTML = "String couldn't be added...";
        }

    } catch (error) {
        console.error("Network Error:", error);
        statusMsg.innerHTML = "String couldn't be added...";
    }
}

async function deleteString(index) {
    const statusMsg = document.getElementById("status");

    try {
        const username = localStorage.getItem("currentUser");
        const userStrings = JSON.parse(localStorage.getItem("userStrings"));
        const stringToKill = userStrings[index];

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, stringToKill, action: "DELETESTRING" })
        });

        const data = await response.json();

        if (response.status === 200) {
            localStorage.setItem("userStrings", JSON.stringify(data.user.strings));
            localStorage.setItem("numStrings", data.user.numStrings);
            statusMsg.innerHTML = "That string is ancient history now... You now have " + data.user.numStrings;
            updateDashboard();
        } 
        
        else {
            statusMsg.innerHTML = "String couldn't be deleted...";
        }

    } catch (error) {
        console.error("Network Error:", error);
        statusMsg.innerHTML = "String couldn't be deleted...";
    }
}

async function logout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userStrings");
    localStorage.removeItem("numStrings");
    window.location.href = "index.html";
}

window.onload = initializeDashboard;