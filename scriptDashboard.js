
const API_URL = "https://s084y4k0bj.execute-api.us-east-1.amazonaws.com/manage";
var deleting = false;
var deletingALL = false;
var del1;
var del2;
var del3;

function initializeDashboard() {
    const currentUser = localStorage.getItem("currentUser");
    const numStrings = localStorage.getItem("numStrings");
    var userStrings = localStorage.getItem("userStrings");
    const userpfp = localStorage.getItem("userPFP");

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

    const pfpelement = document.getElementById("pfp");
    if (!(userpfp.trim().length === 0)){
        pfpelement.src = `${userpfp}?t=${Date.now()}`;
        pfpelement.onload = function() {
            pfpelement.style.opacity = "1";
        };
    }
    else {
        pfpelement.style.opacity = "1";
    }

    if (numStrings == 0) {
        stringsList.innerHTML = "No Strings!";
        return;
    }

    buildTheList();
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

    buildTheList();
}

async function addString() {
    clearTimers();
    const statusMsg = document.getElementById("status");

    try {
        const newString = document.getElementById("newString").value;
        const username = localStorage.getItem("currentUser");

        if (!newString || newString.trim().length === 0) {
            statusMsg.innerHTML = "Fah! I won't deal with empty strings! Away with you!";
            return;
        }

        statusMsg.innerHTML = "Adding " + newString + "..."

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, newString, action: "ADDSTRING" })
        });

        const data = await response.json();

        if (response.status === 200) {
            clense(data.user.username, data.user.numStrings, data.user.strings);
            
            localStorage.setItem("userStrings", JSON.stringify(data.user.strings));
            localStorage.setItem("numStrings", data.user.numStrings);
            localStorage.setItem("totalAdded", data.user.totalAdded);
            localStorage.setItem("achievements", JSON.stringify(data.user.achievements));
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
    clearTimers();
    const statusMsg = document.getElementById("status");

    try {
        const username = localStorage.getItem("currentUser");
        const userStrings = JSON.parse(localStorage.getItem("userStrings"));
        const stringToKill = userStrings[index];

        statusMsg.innerHTML = "Deleting " + stringToKill + "..."

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, stringToKill, action: "DELETESTRING" })
        });

        const data = await response.json();

        if (response.status === 200) {
            clense(data.user.username, data.user.numStrings, data.user.strings);

            localStorage.setItem("userStrings", JSON.stringify(data.user.strings));
            localStorage.setItem("numStrings", data.user.numStrings);
            localStorage.setItem("totalDeleted", data.user.totalDeleted);
            localStorage.setItem("achievements", JSON.stringify(data.user.achievements));
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

async function deleteAllStrings() {
    const statusMsg = document.getElementById("status");
    const numStrings = localStorage.getItem("numStrings");

    if (numStrings == 0){
        statusMsg.innerHTML = "Eh? You've got nothing to delete!"
        return;
    }

    toggleDeletingAllChanges();
    if (!deletingALL){
        if (numStrings == 1){
            statusMsg.innerHTML = "Changed your mind, eh? Your precious " + numStrings + " string lives to see another day";
            return;
        }
        statusMsg.innerHTML = "Changed your mind, eh? Your " + numStrings + " strings live to see another day";
        return;
    }

    try {
        statusMsg.innerHTML = "Deleting all your strings in 3..."

        del1 = setTimeout(() => {
            statusMsg.innerHTML = "Deleting all your strings in 2...";
        }, 1000);

        del2 = setTimeout(() => {
            statusMsg.innerHTML = "Deleting all your strings in 1...";
        }, 2000);

         del3 = setTimeout(() => {
            deleteAllStringsForReal();
        }, 3000);

    } catch (error) {
        console.error("Network Error:", error);
        statusMsg.innerHTML = "All strings couldn't be deleted...";
    }
}

async function deleteAllStringsForReal() {
    const statusMsg = document.getElementById("status");

    try {
        const username = localStorage.getItem("currentUser");

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, action: "DELETEALL" })
        });

        const data = await response.json();

        if (response.status === 200) {
            clense(data.user.username, data.user.numStrings, data.user.strings);

            localStorage.setItem("userStrings", JSON.stringify(data.user.strings));
            localStorage.setItem("numStrings", data.user.numStrings);
            localStorage.setItem("totalDeleted", data.user.totalDeleted);
            localStorage.setItem("achievements", JSON.stringify(data.user.achievements));
            statusMsg.innerHTML = "Nothing like a fresh start eh? You now have " + data.user.numStrings + " strings... obviously";
            toggleDeletingAllChanges();
            updateDashboard();
        } 
        
        else {
            statusMsg.innerHTML = "Couldn't delete all strings...";
        }

    } catch (error) {
        console.error("Network Error:", error);
        statusMsg.innerHTML = "Couldn't delete all strings...";
    }
}

async function sortStrings(action2) {
    clearTimers();
    const statusMsg = document.getElementById("status");
    const numStrings = localStorage.getItem("numStrings");

    if (numStrings == 0){
        statusMsg.innerHTML = "Huh? But you don't have any strings...";
        return;
    }

    try {
        const username = localStorage.getItem("currentUser");
        const oldStrings = JSON.parse(localStorage.getItem("userStrings"));

        if (action2 == "ALPHA"){
            statusMsg.innerHTML = "Sorting alphabetically...";
        }
        else if (action2 == "LENGTH"){
            statusMsg.innerHTML = "Sorting by length...";
        }
        else {
            statusMsg.innerHTML = "an illegal method was used. we will remember that.";
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, action: "SORT", action2 })
        });

        const data = await response.json();

        if (response.status === 200) {
            clense(data.user.username, data.user.numStrings, data.user.strings);

            localStorage.setItem("userStrings", JSON.stringify(data.user.strings));
            localStorage.setItem("numStrings", data.user.numStrings);

            if (JSON.stringify(oldStrings) === JSON.stringify(data.user.strings)){
                statusMsg.innerHTML = "Huh, looks like the sorting didn't do anything... you still have " + data.user.numStrings + " strings";
            }
            else if (action2 == "ALPHA"){
                statusMsg.innerHTML = "Sorted alphabetically! Look at them all in line... you still have " + data.user.numStrings + " strings, naturally";
            }
            else if (action2 == "LENGTH"){
                statusMsg.innerHTML = "Sort by length complete! Isn't that an appealing sight? You still have " + data.user.numStrings + " strings, of course";
            }
            else {
                statusMsg.innerHTML = "this message should never appear";
            }

            updateDashboard();
        } 
        
        else {
            statusMsg.innerHTML = "Strings couldn't be sorted...";
        }

    } catch (error) {
        console.error("Network Error:", error);
        statusMsg.innerHTML = "Your strings are stuck unsorted for now...";
    }
}

function toggleDeleteMode() {

    const currentUser = localStorage.getItem("currentUser");
    const numStrings = localStorage.getItem("numStrings");
    const theButton = document.getElementById("masterDelete");

    const stringsList = document.getElementById("strings");

    if (!currentUser) {
        return
    }

    stringsList.innerHTML = "";

    if (!deleting){
        deleting = true;
    }
    else {
        deleting = false;
    }

    if (deleting) {
        theButton.innerHTML = "Stop Deleting!"
        buildTheList();
    }
    else {
        theButton.innerHTML = "Delete Strings"
        buildTheList();
    }

    if (numStrings == 0) {
        stringsList.innerHTML = "No Strings!";
    }
}

function toggleDeletingAllChanges() {
    const currentUser = localStorage.getItem("currentUser");
    const numStrings = localStorage.getItem("numStrings");
    const theButton = document.getElementById("deleteAll");

    if (!currentUser) {
        return
    }

    if (!deletingALL){
        deletingALL = true;
    }
    else {
        deletingALL = false;
        clearTimers();
    }

    if (deletingALL) {
        theButton.innerHTML = "Cancel Deletion!"
    }
    else {
        theButton.innerHTML = "Delete All Strings"
    }

}

function buildTheList() {

    const numStrings = localStorage.getItem("numStrings");
    var userStrings = JSON.parse(localStorage.getItem("userStrings"));
    const stringsList = document.getElementById("strings");

    if (deleting) {
        for (let i = 0; i < numStrings; i++) {
            stringsList.innerHTML += `${userStrings[i]} <button onclick="deleteString(${i})">Delete</button><br>`;
        }
    }
    else {
        for (let i = 0; i < numStrings; i++) {
            stringsList.innerHTML += `${userStrings[i]}<br>`;
        }
    }

    if (numStrings == 0) {
        stringsList.innerHTML = "No Strings!";
    }
}

async function logout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userStrings");
    localStorage.removeItem("numStrings");
    localStorage.removeItem("userPFP");
    window.location.href = "index.html";
}

//prevents desync bugs with multiple sessions in multiple tabs
function clense(name, num, list){
    localStorage.removeItem("userStrings");
    localStorage.removeItem("numStrings");
    localStorage.removeItem("currentUser");

    localStorage.setItem("currentUser", name);
    localStorage.setItem("numStrings", num);
    localStorage.setItem("userStrings", JSON.stringify(list));
}

function clearTimers() {
    const theButton = document.getElementById("deleteAll");
    theButton.innerHTML = "Delete All Strings"
    deletingALL = false;

    clearTimeout(del1);
    clearTimeout(del2);
    clearTimeout(del3);
}

window.onload = initializeDashboard;