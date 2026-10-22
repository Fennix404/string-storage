
const API_URL = "https://s084y4k0bj.execute-api.us-east-1.amazonaws.com/manage";
var setting = false;
var deletingUser = false;
var timer = null;

function initializeProfile() {
    const username = localStorage.getItem("currentUser");
    const numStrings = localStorage.getItem("numStrings");
    const adds = localStorage.getItem("totalAdded");
    const dels = localStorage.getItem("totalDeleted");
    const loggsons = localStorage.getItem("timesLoggedOn");
    const capacity = localStorage.getItem("stringCapacity");
    const title = localStorage.getItem("title");
    const achievements = JSON.parse(localStorage.getItem("achievements"));

    const siteTitle = document.getElementById("title");
    const status = document.getElementById("status");
    const statslList = document.getElementById("statslist");
    const achiList = document.getElementById("achlist");

    if (!username) {
        window.location.href = "index.html";
        return;
    }

    const userpfp = localStorage.getItem("userPFP");
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

    siteTitle.innerHTML = username;
    status.innerHTML = "<i>" + title + "</i>";

    statslList.innerHTML = "Current Strings: " + numStrings + "<br>";
    statslList.innerHTML += "Total Strings Added: " + adds + "<br>";
    statslList.innerHTML += "Total Strings Deleted: " + dels + "<br>";
    statslList.innerHTML += "Total Logins: " + loggsons + "<br>";
    statslList.innerHTML += "String Capacity: " + capacity;

    achiList.innerHTML = "";
    buildTheList();

}

async function setTitle(title) {
    if (deletingUser){
        const status = document.getElementById("ghostystab");
        status.innerHTML = "Ah, yes! Titles are a great way to take your mind off such... extreme actions...";
        clearTimers();
    }

    const status = document.getElementById("status");

    try {
        status.innerHTML = "<i>Updating title...</i>";

        const username = localStorage.getItem("currentUser");

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, title, action: "SETTITLE" })
        });

        const data = await response.json();

        if (response.status === 200) {
            localStorage.setItem("title", data.user.title);
            status.innerHTML = "<i>" + data.user.title + "</i>";
        } 
        
        else {
            status.innerHTML = "<i>Error!</i>";
        }

    } catch (error) {
        console.error("Network Error:", error);
        status.innerHTML = "<i>Error...</i>";
    }
}

async function deleteUserCountdown() {
    const status = document.getElementById("ghostystab");

    toggleDeletingUserChanges();
    if (!deletingUser){
        status.innerHTML = "Phew... glad you changed your mind... that was quite the scare. Even for me!";
        return;
    }

    try {
        let i = 10;
        timer = null;

        status.innerHTML = "ALERT! ACCOUNT DELETION HAS BEGUN. ACCOUNT WILL BE DELETED IN " + i + "..."

        timer = setInterval(() => {
            i--;

            if (i > 0) {
                status.innerHTML = "ALERT! ACCOUNT DELETION HAS BEGUN. ACCOUNT WILL BE DELETED IN " + i + "..."
            }
            else {
                clearInterval(timer);
                deleteUser();
            }
        }, 1000);

    } catch (error) {
        console.error("Network Error:", error);
        status.innerHTML = "Account has been spared...";
    }

}

async function deleteUser() {
    const status = document.getElementById("ghostystab");

    try {
        const username = localStorage.getItem("currentUser");

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, action: "DELETEUSER" })
        });

        const data = await response.json();

        if (response.status === 200) {

            document.body.innerHTML = `
                <div id = "mainbox">
                    <h1 id = "title"> Farewell, ` + username + `... </h1>

                    <p> Your data has been eradicated from our database. Use the button below to return to the home page </p>
                    <div id="button-wrapperA">
                        <button type="button" onclick="window.location.href='index.html'"> Home </button>
                    </div>
                    <br>
                </div>`;
            localStorage.removeItem("currentUser");
        } 
        
        else {
            status.innerHTML = "Account has been spared...";
        }

    } catch (error) {
        console.error("Network Error:", error);
        status.innerHTML = "Account has been spared...";
    }
}

function openFile() {
    const status = document.getElementById("ghostystab");
    const picker = document.getElementById("filePicker");
        
    if (deletingUser){
        status.innerHTML = "Ah, of course! A new profile picture sounds much better than... deleting this account";
        clearTimers();
    }
    else {
        status.innerHTML = "Want a new profile photo, eh? Nothing like a new look, I say!";
    }

    //button cant upload files, so we use this middleman...
    if (picker) {
        picker.click();
    } 
    else {
        console.error("picker not found...");
    }
}

async function uploadPFP(files) {
    // snag the first uploaded file
    const pic = files[0];
    const status = document.getElementById("ghostystab");
    
    if (!pic) {
        console.log("No file!!");
        return;
    }

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!supportedTypes.includes(pic.type)) {
        status.innerHTML = "Sorry, we only accept PNGs, JPGs, and JPEGs for profile pics...";
        return;
    }

    const size = await new Promise((theData) => {
        const img = new Image();
        img.src = URL.createObjectURL(pic);
        
        img.onload = () => {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            URL.revokeObjectURL(img.src); // free him
            theData({ width, height });   //return the data
        };
    });

    if (size.width > 2000 || size.height > 2000) {
        status.innerHTML = "Gadzooks! That image is WAY too big! Try one with width and height lower than 2000px";
        return;
    }

    try {
        status.innerHTML = "Uploading your picture...";
        const username = localStorage.getItem("currentUser");

        //turn the pic into base 64... ooh...
        const base64String = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(pic);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, filetype : pic.type, base64pic : base64String, action: "SETPFP" })
        });

        const data = await response.json();

        if (response.status === 200) {
            localStorage.setItem("userPFP", data.user.pfpURL);

            const pfp = document.getElementById("pfp");
            pfp.src = `${data.user.pfpURL}?t=${Date.now()}`; //force it to update always

            status.innerHTML = "Profile pic updated! Say, you're quite the looker...";
        } 
        
        else {
            status.innerHTML = "PFP upload failed for some reason...";
        }

    } catch (error) {
        console.error("Network Error:", error);
        status.innerHTML = "PFP upload failed for some reason...";
    }
}

async function appraiseStrings() {
    const status = document.getElementById("ghostystab");

    if (deletingUser){
        status.innerHTML = "Aha! I'd much rather look at your strings than... delete you...";
        clearTimers();
    }
    else {
        status.innerHTML = "Allow me to gander at your current strings...";
    }
    
    //pause for dramatic effect
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(1000);

    try {
        const username = localStorage.getItem("currentUser");

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, action: "APPRAISE" })
        });

        const data = await response.json();

        if (response.status === 200) {
            status.innerHTML = data.user.message;
            localStorage.setItem("stringCapacity", data.user.stringCapacity);
            localStorage.setItem("achievements", JSON.stringify(data.user.achievements));
            initializeProfile();
        } 
        
        else {
            status.innerHTML = "I forgot my Specter Goggles! so the appraise failed...";
        }

    } catch (error) {
        console.error("Network Error:", error);
        status.innerHTML = "I forgot my Specter Goggles! so the appraise failed...";
    }
}

function toggleSetMode() {

    const currentUser = localStorage.getItem("currentUser");
    const theButton = document.getElementById("settitle");

    const achiList = document.getElementById("achlist");

    if (!currentUser) {
        return
    }

    achiList.innerHTML = "";

    if (!setting){
        setting = true;
    }
    else {
        setting = false;
    }

    if (setting) {
        theButton.innerHTML = "Done Setting!"
        buildTheList();
    }
    else {
        theButton.innerHTML = "Set Title"
        buildTheList();
    }
}

function toggleDeletingUserChanges() {
    const currentUser = localStorage.getItem("currentUser");
    const theButton = document.getElementById("deleteUser");

    if (!currentUser) {
        return
    }

    if (!deletingUser){
        deletingUser = true;
        document.body.style.backgroundColor = "#af1313"; 
    }
    else {
        deletingUser = false;
        clearTimers();
    }

    if (deletingUser) {
        theButton.innerHTML = "Cancel Deletion!"
    }
    else {
        theButton.innerHTML = "Delete Account"
    }

}

function buildTheList() {
    const achievements = JSON.parse(localStorage.getItem("achievements"));
    const achiList = document.getElementById("achlist");

    if (setting) {
        for (let i = 0; i < achievements.length; i++) {
            const trueTitle = achievements[i].title.replace(/'/g, "\\'");
            achiList.innerHTML += `${achievements[i].title} - ${achievements[i].desc} <button onclick="setTitle('${trueTitle}')">Set</button><br>`;
        }
    } 
    else {
        for (let i = 0; i < achievements.length; i++) {
            achiList.innerHTML += `${achievements[i].title} - ${achievements[i].desc}<br>`;
        }
    }
}

async function logout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userStrings");
    localStorage.removeItem("numStrings");
    localStorage.removeItem("userPFP");
    window.location.href = "index.html";
}

function clearTimers() {
    const theButton = document.getElementById("deleteUser");
    theButton.innerHTML = "Delete Account"
    document.body.style.backgroundColor = "#e9ebeb"; 
    deletingUser = false;

    clearTimeout(timer);
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

window.onload = initializeProfile;