var interval = -1;
var sid = "";
var err_obj = {seq: null, status: 1, content: {error: "NOT_ONLINE"}};

chrome.browserAction.onClicked.addListener(function(){
	makeRequest({op: "getHeadlines", feed_id: -3}, function(response){
		if(response.content && !response.content.error){
			for(i in response.content){
				if(response.content[i].link)
					chrome.tabs.create({url: response.content[i].link});
			}

			makeRequest({op: "catchupFeed", feed_id: -3});
			empty();
		}else
			error("onClick: Failed (response.content && !response.content.error)");
	});
});

function empty(){
	chrome.browserAction.setIcon({path: "rss_19-gray.png"});
	chrome.browserAction.setBadgeText({text: ""});
}function error(err){
	console.log(err);
	chrome.browserAction.setIcon({path: "rss_19-gray.png"});
	chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
	chrome.browserAction.setBadgeText({text: "!!!"});
}

function makeRequest(obj, callback){
	obj.sid = sid;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", localStorage.url, true);
	xmlhttp.onreadystatechange = (function(){
		if(xmlhttp.readyState == 4){
			if(xmlhttp.status != 200){
				if(callback)
					callback(err_obj);
				return;
			}var response = JSON.parse(xmlhttp.responseText);
			if(response && response.content){
				if(response.content.error || response.status != 0){
					if(response.content.error == "NOT_LOGGED_IN"){
						var req = {"op": "login", "user": localStorage.username,
						           "password": localStorage.password};
						makeRequest(req, function(response){
								sid = response.session_id;
								makeRequest(obj, callback);
							});
					}else{
						if(callback)
							callback(response);
						console.log(response.content.error);
					}
				}else if(callback)
					callback(response);
			}else if(callback)
				callback(err_obj);
		}
	});
	xmlhttp.send(JSON.stringify(obj));
}

function update(){
	if(localStorage.username && localStorage.password && localStorage.url){
		makeRequest({op: "getUnread", feed_id: -3}, function(response){
			if(response.content.unread){
				if(response.content.unread > 0){
					chrome.browserAction.setIcon({path: "rss_19.png"});
					chrome.browserAction.setBadgeBackgroundColor({color: "#FF9100"});
					chrome.browserAction.setBadgeText({text: response.content.unread});
				}else
					empty();
			}else
				error("update: Failed (response.content.unread)");
		});
	}else
		error("Please set username, password, and url in localStorage.");

	if(interval != -1)
		clearInterval(interval);
	// We reset the interval each time in case it was changed in localStorage.
	// It's an interval rather than a timeout because there could be errors that
	// prevent this line from executing, and I'm too lazy to catch them all.
	if(localStorage.interval)
		interval = setInterval(update, localStorage.interval);
	else
		interval = setInterval(update, 10000);
}

update();
