import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const s3 = new S3Client({ region : process.env.AWS_REGION });

export const handler = async (event) => {
    // Handle CORS preflight requests from browser
    if (event.requestContext?.http?.method === "OPTIONS" || event.httpMethod === "OPTIONS") {
        return buildResponse(200, {});
    }

    try {
        // Parse the incoming JSON body
        const body = JSON.parse(event.body || "{}");
        const { username, password, newString, stringToKill, action, action2, title, filetype, base64pic } = body;

        if (!username || !action) {
            return buildResponse(400, { message: "Missing username or action." });
        }

        // route based on the action string
        if (action == "SIGNUP"){
            if (!password) {
                return buildResponse(400, { message: "Password is required for signup." });
            }
            return await handleSignup({username, password});
        }

        else if (action == "LOGIN"){
            if (!password) {
                return buildResponse(400, { message: "Password is required for login!" });
            }
            return await handleLogin({username, password});
        }

        else if (action == "ADDSTRING"){
            if (!newString) {
                return buildResponse(400, { message: "You need a string to add a string... duh..." });
            }
            return await handleAddString({username, newString});
        }

        else if (action == "DELETESTRING"){
            if (!stringToKill) {
                return buildResponse(400, { message: "I have no target... the deal is off, bub." });
            }
            return await handleDeleteString({username, stringToKill});
        }

        else if (action == "DELETEALL"){
            return await handleDeleteAll({username});
        }

        else if (action == "SORT"){
            return await handleSort({username, action2});
        }

        else if (action == "SETTITLE"){
            return await handleSetTtile({username, newTitle : title});
        }

        else if (action == "DELETEUSER"){
            return await handleDeleteUser({username});
        }

        else if (action == "SETPFP"){
            return await handleSetPFP({username, filetype, base64pic});
        }

        else if (action == "APPRAISE"){
            return await handleAppraiseStrings({username});
        }

        else if (action == "GETSTATS"){
            return await handleGetStats({username});
        }

        else{
            return buildResponse(400, { message: `Invalid action: ${action}` });
        }

    } catch (error) {
        console.error("Global Handler Error:", error);
        return buildResponse(500, { message: "Internal server error." });
    }
};

const handleSignup = async (body) => {
    const { username, password } = body;

    // Basic validation
    if (!username || !password) {
        return buildResponse(400, { message: "Username and password are required." });
    }

    try {
        // Check if user already exists
        const checkUser = new GetCommand({
            TableName: "StringStorage",
            Key: { username : username }
        });

        const existingUser = await docClient.send(checkUser);
        if (existingUser.Item) {
            return buildResponse(409, { message: "User already exists." });
        }

        const defaultAch = [{title : "String Squire", desc : "Create an account! (" + new Date().toLocaleDateString('en-US') + ")"}];

        // If not, create the user
        const createUser = new PutCommand({
            TableName: "StringStorage",
            Item: {
                username : username,
                password : password, 
                numStrings : 0,
                strings : [],
                timesLoggedOn : 1,
                totalAdded : 0,
                totalDeleted : 0,
                title : "String Squire",
                achievements : defaultAch,
                stringCapacity : 16,
                pfpUrl : ""
            }
        });

        await docClient.send(createUser);
        return buildResponse(201, { 
            message: "User created successfully.",
            user: { 
                  username: username,
                  numStrings : 0,
                  strings : [],
                  timesLoggedOn : 1,
                  totalAdded : 0,
                  totalDeleted : 0,
                  achievements : defaultAch,
                  title : "String Squire",
                  stringCapacity : 16,
                  pfpUrl : ""
             }
        });

    } catch (error) {
        console.error("Signup Error:", error);
        return buildResponse(500, { message: "Error creating user." });
    }
};

const handleLogin = async (body) => {
  const { username, password } = body;

  try {
      const checkUser = new GetCommand({
          TableName: "StringStorage",
          Key: { username : username }
      });

      const result = await docClient.send(checkUser);
      const user = result.Item;

      if (!user) {
          return buildResponse(401, { message: "User doesn't exist!" });
      }

      else if (user.password !== password) {
          return buildResponse(402, { message: "Wrong password..." });
      }

      const newTimes = (user.timesLoggedOn || 0) + 1;
      const newAchievements = passiveAchievementGet(user.achievements, newTimes, 0, 0, "LOGIN");

      const saveUser = new PutCommand({
        TableName: "StringStorage",
        Item: {
            username: user.username,
            timesLoggedOn : newTimes,
            password: user.password,
            numStrings: user.numStrings,
            strings: user.strings,
            totalDeleted: user.totalDeleted,
            totalAdded : user.totalAdded,
            title : user.title,
            achievements : newAchievements,
            stringCapacity : user.stringCapacity,
            pfpUrl : user.pfpUrl || ""
        }
    });
    await docClient.send(saveUser);

      return buildResponse(200, { 
          message: "Login successful!",
          user: { 
                username: user.username,
                numStrings : user.numStrings,
                strings : user.strings || [],
                timesLoggedOn : newTimes,
                totalAdded : user.totalAdded,
                totalDeleted : user.totalDeleted,
                achievements : newAchievements,
                title : user.title,
                stringCapacity : user.stringCapacity,
                pfpUrl : user.pfpUrl || ""
           }
      });

  } catch (error) {
      console.error("Login Error:", error);
      return buildResponse(500, { message: "Error during login processing." });
  }
};

const handleAddString = async (body) => {
    const { username, newString } = body;
  
    try {
        const checkUser = new GetCommand({
            TableName: "StringStorage",
            Key: { username : username }
        });
  
        const result = await docClient.send(checkUser);
        const user = result.Item;

        if (!user) {
            return buildResponse(404, { message: "User not found!!!1" });
        }

        if ((user.numStrings || 0) >= 1) {
            for (var i = 0; i < user.strings.length; i++){
                if (user.strings[i] == newString) { 
                    return buildResponse(409, { message: "You already have that string!" }); 
                }
            }
        }

        if ((user.numStrings || 0) == user.stringCapacity) {
            return buildResponse(410, { message: "Hit the max string count of user.stringCapacity! Impressive, honestly." });
        }


        //do yo work...
        const currStrings = user.strings || [];
        const newStrings = currStrings.concat(newString);
        const newNumStrings = (user.numStrings || 0) + 1;
        const newTotalAdded = (user.totalAdded || 0) + 1;

        const newAchievements = passiveAchievementGet(user.achievements, 0, newTotalAdded, 0, "ADDSTRING");

        //save the user now that the deed is done
        const saveUser = new PutCommand({
            TableName: "StringStorage",
            Item: {
                username: user.username,
                password: user.password,
                numStrings: newNumStrings,
                strings: newStrings,
                totalAdded: newTotalAdded,
                timesLoggedOn : user.timesLoggedOn,
                totalDeleted : user.totalDeleted,
                title : user.title,
                achievements : newAchievements,
                stringCapacity : user.stringCapacity,
                pfpUrl : user.pfpUrl || ""
            }
        });
        await docClient.send(saveUser);

        //all done!
        return buildResponse(200, { 
            message: "New string successfully added!",
            user: {
                username: user.username,
                numStrings : newNumStrings,
                strings : newStrings,
                totalAdded : newTotalAdded,
                achievements : newAchievements
            }
        });
  
    } catch (error) {
        console.error("Add String Error:", error);
        return buildResponse(500, { message: "String couldn't be added..." });
    }
  };

  const handleDeleteString = async (body) => {
    const { username, stringToKill } = body;
  
    try {
        const checkUser = new GetCommand({
            TableName: "StringStorage",
            Key: { username : username }
        });
  
        const result = await docClient.send(checkUser);
        const user = result.Item;

        if (!user) {
            return buildResponse(404, { message: "User not found!!!1 *sob*" });
        }

        //do work...
        const currStrings = user.strings || [];
        const newStrings = currStrings.filter(str => str !== stringToKill);
        const newNumStrings = (user.numStrings || 0) - 1;
        const newTotalDeleted = (user.totalDeleted || 0) + 1;

        const newAchievements = passiveAchievementGet(user.achievements, 0, 0, newTotalDeleted, "DELETESTRING");

        //save the user now that the deed is done
        const saveUser = new PutCommand({
            TableName: "StringStorage",
            Item: {
                username: user.username,
                password: user.password,
                numStrings: newNumStrings,
                strings: newStrings,
                totalDeleted: newTotalDeleted,
                timesLoggedOn : user.timesLoggedOn,
                totalAdded : user.totalAdded,
                title : user.title,
                achievements : newAchievements,
                stringCapacity : user.stringCapacity,
                pfpUrl : user.pfpUrl || ""
            }
        });
        await docClient.send(saveUser);

        //all done!
        return buildResponse(200, { 
            message: "New string successfully added!",
            user: {
                username: user.username,
                numStrings : newNumStrings,
                strings : newStrings,
                totalDeleted : newTotalDeleted,
                achievements : newAchievements
            }
        });
  
    } catch (error) {
        console.error("Add String Error:", error);
        return buildResponse(500, { message: "String couldn't be KILLED..." });
    }
  };

  const handleDeleteAll = async (body) => {
    const { username } = body;

    try {
        const checkUser = new GetCommand({
            TableName: "StringStorage",
            Key: { username : username }
        });

        const result = await docClient.send(checkUser);
        const user = result.Item;

        if (!user) {
            return buildResponse(404, { message: "User not found!!!1 *sob*" });
        }

        //do work...
        const newStrings = [];
        const newNumStrings = 0;
        const newTotalDeleted = (user.totalDeleted || 0) + user.numStrings;

        const newAchievements = passiveAchievementGet(user.achievements, 0, 0, newTotalDeleted, "DELETESTRING");

        //save the user now that the deed is done
        const saveUser = new PutCommand({
            TableName: "StringStorage",
            Item: {
                username: user.username,
                password: user.password,
                numStrings: newNumStrings,
                strings: newStrings,
                totalDeleted: newTotalDeleted,
                timesLoggedOn : user.timesLoggedOn,
                totalAdded : user.totalAdded,
                title : user.title,
                achievements : newAchievements,
                stringCapacity : user.stringCapacity,
                pfpUrl : user.pfpUrl || ""
            }
        });
        await docClient.send(saveUser);

        //all done!
        return buildResponse(200, {
            message: "Everything deleted!",
            user: {
                username: user.username,
                numStrings : newNumStrings,
                strings : newStrings,
                totalDeleted : newTotalDeleted,
                achievements : newAchievements
            }
        });

    } catch (error) {
        console.error("Delete All Error:", error);
        return buildResponse(500, { message: "Couldn't kill all strings..." });
    }
  };

  const handleSort = async (body) => {
    const { username, action2 } = body;

    try {
        const checkUser = new GetCommand({
            TableName: "StringStorage",
            Key: { username : username }
        });

        const result = await docClient.send(checkUser);
        const user = result.Item;

        if (!user) {
            return buildResponse(404, { message: "User ain't got none existance" });
        }

        var newStrings = [];

        if (action2 == "ALPHA"){ //sort alphabetically
            newStrings = user.strings.sort((a, b) => a.localeCompare(b));
        }
        else if (action2 == "LENGTH") { //sort by length
            newStrings = user.strings.sort((a, b) => {

                if (a.length !== b.length) {
                    return a.length - b.length; // shortest to longest
                }
                
                //break ties alphabetically
                return a.localeCompare(b);
            });
        }
        else {
            return buildResponse(404, { message: "(aosth robotnik voice) NO!" });
        }

        //save the user now that the deed is done
        const saveUser = new PutCommand({
            TableName: "StringStorage",
            Item: {
                username: user.username,
                password: user.password,
                numStrings: user.numStrings,
                strings: newStrings,
                totalDeleted: user.totalDeleted,
                timesLoggedOn : user.timesLoggedOn,
                totalAdded : user.totalAdded,
                title : user.title,
                achievements : user.achievements,
                stringCapacity : user.stringCapacity,
                pfpUrl : user.pfpUrl || ""
            }
        });
        await docClient.send(saveUser);

        //all done!
        return buildResponse(200, {
            message: "Everything sorted. i dont feel like denoting by which method",
            user: {
                username: user.username,
                numStrings : user.numStrings,
                strings : newStrings
            }
        });

    } catch (error) {
        console.error("fatal error when sorting THE PROGRAM DIED OH NO AAHTGHHHHHHHHHH!!!!!!!:", error);
        return buildResponse(500, { message: "Sorting didn't work..." });
    }
  };

  const handleSetTtile = async (body) => { 
    const { username, newTitle } = body;

    try {
        const checkUser = new GetCommand({
            TableName: "StringStorage",
            Key: { username : username }
        });

        const result = await docClient.send(checkUser);
        const user = result.Item;

        if (!user) {
            return buildResponse(404, { message: "User no live" });
        }

        //all done!
        const saveUser = new PutCommand({
            TableName: "StringStorage",
            Item: {
                username: user.username,
                password: user.password,
                numStrings: user.numStrings,
                strings: user.strings,
                totalDeleted: user.totalDeleted,
                timesLoggedOn : user.timesLoggedOn,
                totalAdded : user.totalAdded,
                title : newTitle,
                achievements : user.achievements,
                stringCapacity : user.stringCapacity,
                pfpUrl : user.pfpUrl || ""
            }
        });
        await docClient.send(saveUser);

        //all done!
        return buildResponse(200, {
            message: "title changed",
            user: {
                username: user.username,
                title: newTitle
            }
        });

    } catch (error) {
        console.error("oops! my system crashd! i lost my DATA", error);
        return buildResponse(500, { message: "i haeve no data" });
    }
  };

  const handleDeleteUser = async (body) => {
    const { username } = body;

    try {
        const deleteUser = new DeleteCommand({
            TableName: "StringStorage",
            Key: { username: username },
            ConditionExpression: "attribute_exists(username)" 
        });
    
        await docClient.send(deleteUser);
        return buildResponse(200, { message: "User successfully deleted." });


    } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
            return buildResponse(404, { message: "user has already... pushed up daisies..." });
        }
        return buildResponse(500, { message: "i missed..." });
    }
  };

  const handleSetPFP = async (body) => {
    const { username, filetype, base64pic } = body;

    try {
        // strip it down to the base 64 data we care about
        const pureBase64 = base64pic.includes(",") ? base64pic.split(",")[1] : base64pic;

        //turns the base64 mumbo jumbo back into a handsome image
        const imageBuffer = Buffer.from(pureBase64, "base64");

        //now build the filename...
        const fileExtension = filetype.split("/")[1] || "jpg";
        const fileKey = `pfps/${username}-pfp.${fileExtension}`;
        const bucketName = "stringstoragepfps";

        // but first, we search for old stuff to delete...
        const listCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: `pfps/${username}-pfp`
        });
        //now with the command we search, listedObjects will hold the results...
        const listedObjects = await s3.send(listCommand);

        //if matches were gound... do the deed...
        if (listedObjects.Contents && listedObjects.Contents.length > 0) {
    
            // first we need to turn the found list into something readable... groan...
            const filesToKill = listedObjects.Contents.map(function(item) {
                return { Key: item.Key }; // extracts filepath...
            });
        
            // prepare the command...
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: bucketName,
                Delete: { Objects: filesToKill }
            });
            
            // go forth!
            await s3.send(deleteCommand);
            console.log("Old pfps found and eliminated...");
        }

        //now put the new guy the bucket... which i has
        await s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Body: imageBuffer,
            ContentType: filetype // ensures the browser renders it visually instead of downloading it
          }));

        //the gateway to the image that will be etched into the user's soul
        const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        
        //now update!
        const updateUser = new UpdateCommand({
            TableName: "StringStorage", 
            Key: { username: username },
            UpdateExpression: "SET pfpUrl = :pfpUrl",
            ExpressionAttributeValues: {":pfpUrl": imageUrl }
        });
        await docClient.send(updateUser);

        return buildResponse(200, {
            message: "pfp updaaeted brah",
            user: {
                username: username,
                pfpURL: imageUrl
            }
        });

    } catch (error) {
        console.error("pfp no upload! curse of no sauce to youuuuuuuuuuuu", error);
        return buildResponse(500, { message: "no work it" });
    }

  };

  const handleAppraiseStrings = async (body) => {
    const { username } = body;

    try {
        const checkUser = new GetCommand({
            TableName: "StringStorage",
            Key: { username : username }
        });

        const result = await docClient.send(checkUser);
        const user = result.Item;

        if (!user) {
            return buildResponse(404, { message: "thar be no user for me" });
        }

        const newAchievements = appraiseStrings(user.achievements, user.strings);
        var newCapacity = user.stringCapacity;
        var message = "Hm... your strings are nice, but nothing special. Try appraising some other time!";

        if (newAchievements.length > user.achievements.length) {
            message = "Oho! You've got a special combination of strings with you at the moment! Here's an achievement for the occasion!";
        }

        if (user.totalAdded >= 24 && user.stringCapacity == 16) {
            if (!(message.charAt(0) === "H")) {
                message += "<br>"
                message += "And what's this? You've added 24 or more strings? Let me increase your string capacity to 24 to match. Convenient, eh?";
            }
            else {
                message = "I'll say! You've added 24 or more strings? Let me increase your string capacity to 24 to match. Convenient, eh?";
            }
            newCapacity = 24;
        }

        else if (user.totalAdded >= 32 && user.stringCapacity == 24) {
            if (!(message.charAt(0) === "H")) {
                message += "<br>"
                message += "And what's this? You've added 32 or more strings? Allow me to increase your string capacity once again. The more strings the merrier!";
            }
            else {
                message = "My word! You've added 32 or more strings? Allow me to increase your string capacity once again. The more strings the merrier!";
            }
            newCapacity = 32;
        }

        else if (user.stringCapacity == 32 && (message.charAt(0) === "H")) {
            message = "Your current list won't net you any achievements, but I thought I should let you know you've earned " 
                + newAchievements.length + "/20 of them";
            if (newAchievements.length == 20) {
                message += "<br> Wait a minute, that's ALL of them! Congratulations! You're truly a Superb String Savant!";
                message += "<br> In fact, why don't I give you that as a title? Go on, don't be shy! Thank you for using this app so much!";
                newAchievements.push({title : "Superb String Savant!", desc : "Get all 20 achievements! (" + new Date().toLocaleDateString('en-US') + ")"});
            }
        }

        if (newAchievements.length == 21) {
            message = "You've already gotten all my praise! If anything, you should be appraising me!";
        }

        //update!
        const updateUser = new UpdateCommand({
            TableName: "StringStorage", 
            Key: { username: username },
            UpdateExpression: "SET achievements = :newAchievements, stringCapacity = :newCapacity",
            ExpressionAttributeValues: {":newAchievements": newAchievements, ":newCapacity": newCapacity }
        });
        await docClient.send(updateUser);

        //all done!
        return buildResponse(200, {
            message: "new data!",
            user: {
                username: user.username,
                stringCapacity : newCapacity,
                achievements : newAchievements,
                message : message
            }
        });

    } catch (error) {
        console.error("oops! my system crashd! i lost my DATA", error);
        return buildResponse(500, { message: "i haeve no data" });
    }
  };

  const handleGetStats = async (body) => { //unused currently
    const { username } = body;

    try {
        const checkUser = new GetCommand({
            TableName: "StringStorage",
            Key: { username : username }
        });

        const result = await docClient.send(checkUser);
        const user = result.Item;

        if (!user) {
            return buildResponse(404, { message: "User no live" });
        }

        //all done!
        return buildResponse(200, {
            message: "here ye data",
            user: {
                username: user.username,
                timesLoggedOn : user.timesLoggedOn,
                totalAdded : user.totalAdded,
                totalDeleted : user.totalDeleted,
                stringCapacity : user.stringCapacity,
                achievements : user.achievements
            }
        });

    } catch (error) {
        console.error("oops! my system crashd! i lost my DATA", error);
        return buildResponse(500, { message: "i haeve no data" });
    }
  };

function passiveAchievementGet(achievements, timesLoggedOn, totalAdded, totalDeleted, action) {
    var newAchievements = [...achievements];
    // ex achievement; [{title : "String Squire", desc : "Create an account (" + new Date().toLocaleDateString('en-US') + ")"}];

    if (action == "LOGIN") {
        if (timesLoggedOn == 3) {
            newAchievements.push({title : "String Curious", desc : "Login 3 times (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        else if (timesLoggedOn == 5) {
            newAchievements.push({title : "String Fanatic", desc : "Login 5 times (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        else if (timesLoggedOn == 10) {
            newAchievements.push({title : "String Veteran", desc : "Login 10 times (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        else if (timesLoggedOn == 25) {
            newAchievements.push({title : "Gaga for Strings", desc : "Login 25 times. You must love this app! (" + new Date().toLocaleDateString('en-US') + ")"});
        }
    }

    else if (action == "ADDSTRING"){
        if (totalAdded == 3) {
            newAchievements.push({title : "Adder", desc : "Add 3 strings! (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        else if (totalAdded == 7) {
            newAchievements.push({title : "Creator", desc : "Add 7 strings. Ah, the gift of life... (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        else if (totalAdded == 16) {
            newAchievements.push({title : "Making History", desc : "Add 16 strings. Room for more? (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        else if (totalAdded == 29) {
            newAchievements.push({title : "Mother of Strings", desc : "Add 29 strings. That's quite a lot... (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        else if (totalAdded == 50) {
            newAchievements.push({title : "Harbinger of Creation", desc : "Add 50 strings. You're a master at adding! (" + new Date().toLocaleDateString('en-US') + ")"});
        }
    }

    else if (action == "DELETESTRING") {
        if (totalDeleted >= 3 && !newAchievements.some(thing => thing.title === "Deleter")) {
            newAchievements.push({title : "Deleter", desc : "Delete 3 strings (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        if (totalDeleted >= 12 && !newAchievements.some(thing => thing.title === "Killer")) {
            newAchievements.push({title : "Killer", desc : "Delete 12 strings. You think it hurts them? (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        if (totalDeleted >= 20 && !newAchievements.some(thing => thing.title === "Mass Destruction")) {
            newAchievements.push({title : "Mass Destruction", desc : "Delete 20 strings. Poor strings... (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        if (totalDeleted >= 34 && !newAchievements.some(thing => thing.title === "Extinction")) {
            newAchievements.push({title : "Extinction", desc : "Delete 34 strings. Will they recover? (" + new Date().toLocaleDateString('en-US') + ")"});
        }
        if (totalDeleted >= 50 && !newAchievements.some(thing => thing.title === "Harbinger of Deletion")) {
            newAchievements.push({title : "Harbinger of Deletion", desc : "Delete 50 strings. All strings will cower before you! (" + new Date().toLocaleDateString('en-US') + ")"});
        }
    }
    return newAchievements
}

function appraiseStrings(currAchievements, userStrings){
    var newAchievements = [...currAchievements];
    // ex achievement; [{title : "String Squire", desc : "Create an account (" + new Date().toLocaleDateString('en-US') + ")"}];

    if (userStrings.includes("Ghosty") && !currAchievements.some(thing => thing.title === "Ghosty's Pal")) {
        newAchievements.push({title : "Ghosty's Pal", desc : "Have 'Ghosty' in your list and appraise. He really is your pal! (" + new Date().toLocaleDateString('en-US') + ")"});
    }

    if (userStrings.includes("Fennix") && userStrings.includes("Amanda") && userStrings.includes("Ghosty") && userStrings.includes("Mr. Garbij") && (userStrings.includes("Bob") || userStrings.includes("Bobbington")) && !currAchievements.some(thing => thing.title === "HQ Intern")) {
        newAchievements.push({
            title : "HQ Intern", 
            desc : "Have the names of all 5 Fennix HQ employees in your list and appraise. Are you the new recruit? (" + new Date().toLocaleDateString('en-US') + ")"
        });
    }

    if (userStrings.includes("Mario") && userStrings.includes("Luigi") && !currAchievements.some(thing => thing.title === "Hooked on da Brothers!")) {
        newAchievements.push({title : "Hooked on da Brothers!", desc : "Have 'Mario' and 'Luigi' in your list and appraise. Talk about famous... (" + new Date().toLocaleDateString('en-US') + ")"});
    }

    if (userStrings.includes("Groove") && !currAchievements.some(thing => thing.title === "Groovin'")) {
        newAchievements.push({title : "Groovin'", desc : "Have 'Groove' in your list and appraise. What a miracle! (" + new Date().toLocaleDateString('en-US') + ")"});
    }

    if (userStrings.includes("Fever") && !currAchievements.some(thing => thing.title === "High Fever")) {
        newAchievements.push({title : "High Fever", desc : "Have 'Fever' in your list and appraise. You're ready to beat the beat! (" + new Date().toLocaleDateString('en-US') + ")"});
    }
    return newAchievements;
}

function buildResponse(statusCode, body) {
  return {
      statusCode: statusCode,
      headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST,OPTIONS",
          "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
  };
}
