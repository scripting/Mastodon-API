const appConsts = {
	urlMastodonServer: "http://social.scottfr.ee/",
	urlMastoLandServer: "http://dave.masto.land/", //it's running mastoserver.js
	clientKey: "1Z-8Zf2vOuGnmXY8w8YPwjAtSGuKwmSNxGqy_b2IEk8"
	};

var mastodonMemory = {
	access_token: undefined,
	created_at: undefined,
	scope: undefined,
	token_type: undefined,
	lastTootString: ""
	}

function saveMastodonMemory () {
	localStorage.mastodonMemory = jsonStringify (mastodonMemory);
	console.log ("saveMastodonMemory: localStorage.mastodonMemory == " + jsonStringify (localStorage.mastodonMemory));
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

function userLogin () {
	const urlThisPage = trimTrailing (window.location.href, "#");
	const urlRedirectTo = appConsts.urlMastoLandServer + "connect?redirect_url=" + urlThisPage;
	window.location.href = urlRedirectTo;
	}
function getAccessToken (codeFromMasto, callback) {
	var urlServer = appConsts.urlMastoLandServer + "getaccesstoken?code=" + codeFromMasto;
	httpRequest (urlServer, undefined, undefined, callback);
	}
function postStatus (theMessage, callback) {
	$.ajax ({
		url: appConsts.urlMastodonServer + "api/v1/statuses",
		type: "POST",
		headers: {
			Authorization: "Bearer " + mastodonMemory.access_token
			},
		data: {
			status: theMessage
			},
		dataType: "json"
		})  
	.success (function (data, status) { 
		if (callback !== undefined) {
			callback (undefined, data);
			}
		}) 
	.error (function (status) { 
		if (callback !== undefined) {
			try {
				var jstruct = JSON.parse (status.responseText);
				callback ({message: jstruct.error});
				}
			catch (err) {
				callback ({message: "There was an error communicating with the server."});
				}
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

function startup () {
	console.log ("startup");
	
	function everySecond () {
		const flSignedOn = mastodonMemory.access_token !== undefined;
		if (flSignedOn) {
			$("#idSignedOn").css ("display", "block");
			$("#idSignedOff").css ("display", "none");
			}
		else {
			$("#idSignedOn").css ("display", "none");
			$("#idSignedOff").css ("display", "block");
			}
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
	
	restoreMastodonMemory ();
	lookForOauthToken (); //if found it doesn't return
	
	const loginbutton = $("#idMastoSignonButton");
	loginbutton.click (function () {
		console.log ("Click");
		loginbutton.blur ();
		userLogin ();
		});
	
	const signoffbutton = $("#idMastoSignoffButton");
	signoffbutton.click (function () {
		for (var x in mastodonMemory) {
			mastodonMemory [x] = undefined;
			}
		saveMastodonMemory ();
		});
	
	const mastotootbutton = $("#idMastoTootButton");
	mastotootbutton.click (function () {
		testPostStatus ();
		});
	
	self.setInterval (everySecond, 1000);
	}
