var interval = -1;
var sid = "";
// This object is formatted like an API response so it can be passed and handled like any other error
var err_obj = {seq: null, status: 1, content: {error: "NOT_ONLINE"}};

var last_notification = "";

function openAll(){
	makeRequest({op: "getHeadlines", feed_id: -4, view_mode: "unread"}, function(response){
		if(response.content && !response.content.error){
			for(var i = 0; i < response.content.length; i++){
				if(response.content[i].link)
					chrome.tabs.create({url: response.content[i].link});
			}

			makeRequest({op: "catchupFeed", feed_id: -4, view_mode: "unread"});
			empty();
		}else
			error("onClick: Failed (response.content && !response.content.error)");
	});
	chrome.notifications.clear("update", function(){/* useless but required */});
}

chrome.browserAction.onClicked.addListener(openAll);
chrome.notifications.onClicked.addListener(openAll);

function empty(){
	chrome.browserAction.setIcon({path: "rss_19-gray.png"});
	chrome.browserAction.setBadgeText({text: ""});
	chrome.notifications.clear("update", function(){/* useless but required */});
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
			}
			var response = JSON.parse(xmlhttp.responseText);
			if(response && response.content){
				if(response.content.error || response.status != 0){
					if(response.content.error == "NOT_LOGGED_IN"){
						var req = {
							"op": "login",
							"user": localStorage.username,
							"password": localStorage.password
						};
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

function showUpdates(){
	makeRequest({op: "getHeadlines", feed_id: -4, view_mode: "unread", limit: 5}, function(response){
		if(response.content && !response.content.error){
			var items = [];
			var temp_notification = "";
			for(var i = 0; i < response.content.length; i++){
				var item = response.content[i];
				if(item.feed_title && item.title){
					temp_notification += item.feed_id + "." + item.id + ",";
					items.push({
						title: item.feed_title,
						message: item.title
					});
				}
			}

			if(temp_notification !== last_notification && items.length !== 0){
				last_notification = temp_notification;

				chrome.browserAction.getBadgeText({}, function(count){
					var title = count + " new feed item";
					if(count != 1)
						title += "s";
					// Google hates Linux, so list notifications still aren't supported in Chrome 32.
					// This will be displayed on Linux (and outdated Chrome installs)
					var message = items[0].title + " - " + items[0].message;

					chrome.notifications.clear("update", function(){/* useless but required */});
					chrome.notifications.create("update", {
						type: "list",
						title: title,
						iconUrl: "rss_128.png",
						message: message,
						items: items
					}, function(){/* useless but required */});
				}
			}
		}else
			error("onClick: Failed (response.content && !response.content.error)");
	});
}

function update(){
	if(localStorage.username && localStorage.password && localStorage.url){
		makeRequest({op: "getUnread", feed_id: -4, view_mode: "unread"}, function(response){
			if(response.content.unread){
				if(response.content.unread > 0){
					chrome.browserAction.setIcon({path: "rss_19.png"});
					chrome.browserAction.setBadgeBackgroundColor({color: "#FF9100"});
					chrome.browserAction.setBadgeText({text: response.content.unread});
					if(localStorage.notifications === "true")
						showUpdates();
				}else
					empty();
			}else
				error("update: Failed (response.content.unread)");
		});
	}else
		error("Please set username, password, and url in localStorage.");

	if(interval != -1)
		clearInterval(interval);
	// We reset the interval each tick in case it was changed in localStorage.
	// It's an interval rather than a timeout because there could be errors that
	// prevent this line from executing, and I'm too lazy to catch them all.
	if(localStorage.interval)
		interval = setInterval(update, localStorage.interval);
	else
		interval = setInterval(update, 10000);
}

update();
