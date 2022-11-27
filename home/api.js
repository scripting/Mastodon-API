const myServerUrl = "http://localhost:1401/"; 

const myClientKey = "2l26ogBP5utGp-VAf0J66r23KDn5aCRTjC0m9MoHdfQ"; //radio3 on 


var mastodonMemory = {
	urlMastoLandServer: myServerUrl, 
	
	clientKey: myClientKey, 
	
	access_token: undefined,
	created_at: undefined,
	scope: undefined,
	token_type: undefined,
	
	lastTootString: ""
	}
function saveMastodonMemory () {
	localStorage.mastodonMemory = jsonStringify (mastodonMemory);
	}
function restoreMastodonMemory () {
	if (localStorage.mastodonMemory !== undefined) {
		var jstruct;
		try {
			jstruct = JSON.parse (localStorage.mastodonMemory);
			for (var x in jstruct) {
				mastodonMemory [x] = jstruct [x];
				}
			}
		catch (err) {
			console.log ("restoreMastodonMemory: err.message == " + err.message);
			}
		}
	console.log ("restoreMastodonMemory: mastodonMemory == " + jsonStringify (mastodonMemory));
	}

function initMastodonMemory () {
	for (var x in mastodonMemory) {
		mastodonMemory [x] = undefined;
		}
	mastodonMemory.urlMastoLandServer = myServerUrl;
	mastodonMemory.clientKey = myClientKey;
	}



function getAllUrlParams () { //9/7/22 by DW
	var s = location.search;
	var allparams = new Object ();
	if (beginsWith (s, "?")) {
		s = stringDelete (s, 1, 1);
		}
	var splits = s.split ("&");
	splits.forEach (function (item) {
		var splits = item.split ("=");
		allparams [splits [0]] = splits [1];
		});
	return (allparams);
	}
function getFirstUrlParam (paramval) {//5/26/22 by DW
	var s = location.search;
	if (beginsWith (s, "?")) {
		s = stringDelete (s, 1, 1);
		}
	var param1 = stringNthField (s, "&", 1);
	if (param1.length == 0) {
		return ("");
		}
	paramval.val = decodeURIComponent (stringNthField (param1, "=", 2));
	return (stringNthField (param1, "=", 1));
	}
function httpRequest (url, timeout, headers, callback) {
	timeout = (timeout === undefined) ? 30000 : timeout;
	var jxhr = $.ajax ({ 
		url: url,
		method: "GET",
		dataType: "text", 
		headers,
		timeout
		}) 
	.success (function (data, status) { 
		callback (undefined, data);
		}) 
	.error (function (status) { 
		var message;
		try { //9/18/21 by DW
			message = JSON.parse (status.responseText).message;
			}
		catch (err) {
			message = status.responseText;
			}
		if ((message === undefined) || (message.length == 0)) { //7/22/22 by DW & 8/31/22 by DW
			message = "There was an error communicating with the server.";
			}
		var err = {
			code: status.status,
			message
			};
		callback (err);
		});
	}
function buildParamList (paramtable, flPrivate) { //8/4/21 by DW
	var s = "";
	if (flPrivate) {
		paramtable.flprivate = "true";
		}
	for (var x in paramtable) {
		if (paramtable [x] !== undefined) { //8/4/21 by DW
			if (s.length > 0) {
				s += "&";
				}
			s += x + "=" + encodeURIComponent (paramtable [x]);
			}
		}
	return (s);
	}

function userLogin (clientKey) {
	const urlThisPage = trimTrailing (window.location.href, "#");
	const urlRedirectTo = mastodonMemory.urlMastoLandServer + "connect?redirect_url=" + urlThisPage + "&client_key=" + clientKey;
	window.location.href = urlRedirectTo;
	}
function getAccessToken (codeFromMasto, callback) {
	var urlServer = mastodonMemory.urlMastoLandServer + "getaccesstoken?code=" + codeFromMasto + "&client_key=" + mastodonMemory.clientKey;
	httpRequest (urlServer, undefined, undefined, callback);
	}

function servercall (path, params, flAuthenticated, callback, urlServer=mastodonMemory.urlMastoLandServer) {
	var whenstart = new Date ();
	if (params === undefined) {
		params = new Object ();
		}
	if (flAuthenticated) { //1/11/21 by DW
		params.access_token = mastodonMemory.access_token;
		params.client_key = mastodonMemory.clientKey;
		}
	var url = urlServer + path + "?" + buildParamList (params);
	httpRequest (url, undefined, undefined, function (err, jsontext) {
		if (err) {
			console.log ("servercall: url == " + url + ", err.message == " + err.message);
			callback (err);
			}
		else {
			callback (undefined, JSON.parse (jsontext));
			}
		});
	}

function getServerInfo (callback) {
	servercall ("api/v1/instance", undefined, undefined, callback);
	}
function getPublicTimeline (limit=100, callback) {
	servercall ("api/v1/timelines/public", {limit}, undefined, callback);
	}
function getPublicStatusesWithTag (theTag, limit=100, callback) {
	servercall ("api/v1/timelines/tag/" + theTag, {limit}, undefined, callback);
	}
function getUserStatuses (id, limit=100, callback) {
	servercall ("api/v1/accounts/" + id + "/statuses/", {limit}, undefined, callback);
	}
function postNewStatus (status, inReplyTo, callback) {
	const params = {
		status,
		inReplyTo
		};
	servercall ("toot", params, true, callback);
	}
function getUserInfo (callback) {
	servercall ("getuserinfo", undefined, true, callback);
	}

function testGetServerInfo () {
	getServerInfo (function (err, theServerInfo) {
		if (err) {
			console.log (err.message);
			}
		else {
			console.log (jsonStringify (theServerInfo));
			}
		})
	}
function testGetPublicTimeline () {
	getPublicTimeline (undefined, function (err, theTimeline) {
		if (err) {
			console.log (err.message);
			}
		else {
			console.log (jsonStringify (theTimeline));
			}
		})
	}
function testGetPublicStatusesWithTag () {
	getPublicStatusesWithTag ("testing", undefined, function (err, theStatuses) {
		if (err) {
			console.log (err.message);
			}
		else {
			console.log (jsonStringify (theStatuses));
			}
		})
	}
function testGetUserStatuses () {
	getUserStatuses ("109348280299564804", undefined, function (err, theStatuses) {
		if (err) {
			console.log (err.message);
			}
		else {
			console.log (jsonStringify (theStatuses));
			}
		})
	}
function testGetUserInfo () {
	getUserInfo (function (err, theInfo) {
		if (err) {
			console.log (err.message);
			}
		else {
			console.log (jsonStringify (theInfo));
			}
		});
	}
function testPostStatus () {
	postStatus ("I'm a tootin fool", function (err, data) {
		if (err) {
			alertDialog (err.message);
			}
		else {
			console.log (data); //11/20/22 -- I have yet to see what I get back from this! ;-)
			}
		});
	}

function lookForOauthToken () {
	var allparams = getAllUrlParams (); //9/7/22 by DW
	var paramval = {
		};
	var firstParam = getFirstUrlParam (paramval);
	switch (firstParam) { 
		case "code": 
			getAccessToken (paramval.val, function (err, jsontext) {
				if (err) {
					alertDialog (err.message);
					}
				else {
					try {
						jstruct = JSON.parse (jsontext);
						}
					catch (err) {
						alertDialog (err.message);
						}
					for (var x in jstruct) {
						mastodonMemory [x] = jstruct [x];
						}
					saveMastodonMemory ();
					setTimeout (function () { //make absolutely sure the localStorage data is saved before we redirect
						window.location.href = stringNthField (window.location.href, "?", 1);
						}, 5)
					}
				});
			break;
		}
	}
