
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

    const line = document.getElementById("sample");
    line.innerHTML = `Welcome ${currentUser}! You have ${numStrings} strings stored.`;
    
}

window.onload = initializeDashboard;