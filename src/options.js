function error(id){
	console.log("Error: " + id.replace("-row", ""));
	if(id && document.getElementById(id))
		document.getElementById(id).className = "row error";
	return false;
}

window.onload = function(){
	document.getElementById("version").innerText = "v" + chrome.app.getDetails().version;

	if(localStorage.username)
		document.getElementById("username").value = localStorage.username;
	if(localStorage.password)
		document.getElementById("password").setAttribute("placeholder", "(unchanged)");
	if(localStorage.url)
		document.getElementById("url").value = localStorage.url;

	document.getElementById("options").onsubmit = function(){
		var username = document.getElementById("username").value + "";
		var password = document.getElementById("password").value + "";
		var url = document.getElementById("url").value + "";

		if(username.length > 0)
			document.getElementById("username-row").className = "row";
		else
			return error("username-row");

		if(password.length === 0){
			if(localStorage.password && localStorage.password.length > 0){
				password = localStorage.password;
				document.getElementById("password-row").className = "row";
			}else
				return error("password-row");
		}else
			document.getElementById("password-row").className = "row";

		if(url.length > 0){
			// Make sure that at least the beginning looks sort of like a URL
			if(url.match(/^https?:\/\/[a-z0-9-\.]+/) !== null){
				document.getElementById("url-row").className = "row";
				if(url.match(/\/$/) === null)
					url += "/";
				if(url.match(/api\/$/) === null)
					url += "api/";
			}else
				return error("url-row");
		}else
			return error("url-row");

		document.getElementById("url").value = url;
		document.getElementById("password").setAttribute("placeholder", "(unchanged)");
		document.getElementById("password").value = "";

		localStorage.username = username;
		localStorage.password = password;
		localStorage.url = url;

		return false;
	};
};
