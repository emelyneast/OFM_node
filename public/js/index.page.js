let sessionUsername = window.localStorage.getItem("username") != undefined ? window.localStorage.getItem("username") : "";
let sessionToken = window.localStorage.getItem("authToken") != undefined ? window.localStorage.getItem("authToken") : "";

socket.emit("tokenAuth", {username: sessionUsername, token: sessionToken});

socket.on("showError", (pMessage)=>{
})