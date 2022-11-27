const myVersion = "0.4.0", myProductName = "mastoserver"; 

const fs = require ("fs");
const request = require ("request");
const davehttp = require ("davehttp");
const utils = require ("daveutils");

var config = {
	apps: new Array (),
	httpPort: process.env.PORT || 1401,
	flLogToConsole: true,
	flAllowAccessFromAnywhere: true, 
	flPostEnabled: false, 
	blockedAddresses: []
	};
const fnameConfig = "config.json";
function readConfig (callback) {
	fs.readFile (fnameConfig, function (err, jsontext) {
		if (!err) {
			var jstruct;
			try {
				jstruct = JSON.parse (jsontext);
				for (var x in jstruct) {
					config [x] = jstruct [x];
					}
				}
			catch (err) {
				console.log ("readConfig: err.message == " + utils.jsonStringify (err.message));
				}
			}
		callback ();
		});
	}

function httpRequest (url, method="GET", callback) {
	var theRequest = {
		method,
		url
		};
	request (theRequest, function (err, response, data) {
		if (err) {
			callback (err);
			}
		else {
			var code = response.statusCode;
			if ((code < 200) || (code > 299)) {
				const message = "The request returned a status code of " + response.statusCode + ".";
				callback ({message});
				}
			else {
				callback (undefined, data) 
				}
			}
		});
	}
function buildParamList (paramtable, flPrivate=false) { //8/4/21 by DW
	var s = "";
	if (paramtable === undefined) { //11/21/22 by DW
		paramtable = new Object ();
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
function getAppInfo (clientKey, callback) {
	readConfig (function () {
		var info = undefined;
		config.apps.forEach (function (item) {
			if (item.clientKey == clientKey) {
				info = item;
				}
			});
		if (info === undefined) {
			const message = "Can't get info about the server because there is no server with the key.";
			callback ({message});
			}
		else {
			callback (undefined, info);
			}
		});
	}
function getUrlForAuthorize (clientKey, urlRedirect, callback) {
	const path = "oauth/authorize";
	getAppInfo (clientKey, function (err, appInfo) {
		if (err) {
			console.log ("\ngetUrlForAuthorize: err.message == " + err.message + ", clientKey == " + clientKey + "\n");
			callback (err);
			}
		else {
			const params = {
				client_id: clientKey,
				redirect_uri: urlRedirect,
				response_type: "code",
				force_login: true
				};
			const paramlist = buildParamList (params, false) + "&scope=" + appInfo.scopes;
			const url = appInfo.urlMastodonServer + path + "?" + paramlist;
			console.log ("\ngetUrlForAuthorize: url == " + url + "\n");
			callback (undefined, url);
			}
		});
	}
function getAccessToken (codeFromMasto, clientKey, callback) {
	const path = "oauth/token";
	getAppInfo (clientKey, function (err, appInfo) {
		if (err) {
			callback (err);
			}
		else {
			const params = {
				grant_type: "authorization_code", 
				client_id: appInfo.clientKey,
				client_secret: appInfo.clientSecret,
				redirect_uri: appInfo.urlRedirect,
				code: codeFromMasto
				};
			const url = appInfo.urlMastodonServer + path + "?" + buildParamList (params, false) + "&scope=" + appInfo.scopes;
			console.log ("getAccessToken: url == " + url);
			httpRequest (url, "POST", function (err, jsontext) {
				if (err) {
					callback (err);
					}
				else {
					try {
						var jstruct = JSON.parse (jsontext);
						callback (undefined, jstruct);
						}
					catch (err) {
						callback (err);
						}
					}
				});
			}
		});
	}

function mastocall (path, params, accessToken, clientKey, callback) {
	getAppInfo (clientKey, function (err, appInfo) {
		if (err) {
			callback (err);
			}
		else {
			var headers = undefined;
			if (accessToken !== undefined) {
				headers = {
					Authorization: "Bearer " + accessToken
					};
				}
			const theRequest = {
				url: appInfo.urlMastodonServer + path + "?" + buildParamList (params),
				method: "GET",
				headers,
				};
			request (theRequest, function (err, response, data) {
				function sendBackError (defaultMessage) {
					var flcalledback = false;
					if (data !== undefined) {
						try {
							jstruct = JSON.parse (data);
							if (jstruct.error !== undefined) {
								callback ({message: jstruct.error});
								flcalledback = true;
								}
							}
						catch (err) {
							}
						}
						
					if (!flcalledback) {
						callback ({message: defaultMessage});
						}
					}
				if (err) {
					sendBackError (err.message);
					}
				else {
					var code = response.statusCode;
					if ((code < 200) || (code > 299)) {
						const message = "The request returned a status code of " + response.statusCode + ".";
						sendBackError (message);
						}
					else {
						callback (undefined, data) 
						}
					}
				});
			}
		});
	}
function mastopost (path, params, accessToken, clientKey, filedata, callback) {
	getAppInfo (clientKey, function (err, appInfo) {
		if (err) {
			callback (err);
			}
		else {
			const theRequest = {
				url: appInfo.urlMastodonServer + path + "?" + buildParamList (params),
				method: "POST",
				headers: {
					Authorization: "Bearer " + accessToken
					},
				body: filedata
				};
			console.log ("mastopost: theRequest == " + utils.jsonStringify (theRequest));
			request (theRequest, function (err, response, data) {
				if (err) {
					console.log ("mastopost: err.message == " + err.message);
					callback (err);
					}
				else {
					var code = response.statusCode;
					console.log ("mastopost: response.statusCode == " + response.statusCode);
					if ((code < 200) || (code > 299)) {
						const message = "The request returned a status code of " + response.statusCode + ".";
						callback ({message});
						}
					else {
						callback (undefined, data) 
						}
					}
				});
			}
		});
	}

function tootStatus (accessToken, clientKey, statusText, inReplyTo, callback) {
	const params = {
		status: statusText,
		in_reply_to_id: inReplyTo
		};
	console.log ("tootStatus: statusText == " + statusText + ", inReplyTo == " + inReplyTo);
	mastopost ("api/v1/statuses", params, accessToken, clientKey, undefined, callback);
	}
function getUserInfo (accessToken, clientKey, callback) {
	mastocall ("api/v1/accounts/verify_credentials", undefined, accessToken, clientKey, callback);
	}


function handleHttpRequest (theRequest) {
	var params = theRequest.params;
	const token = params.oauth_token;
	const secret = params.oauth_token_secret;
	function returnPlainText (s) {
		theRequest.httpReturn (200, "text/plain", s.toString ());
		}
	function returnHtml (htmltext) {
		theRequest.httpReturn (200, "text/html", htmltext.toString ());
		}
	function returnData (jstruct) {
		if (jstruct === undefined) {
			jstruct = {};
			}
		theRequest.httpReturn (200, "application/json", utils.jsonStringify (jstruct));
		}
	function returnJsontext (jsontext) { //9/14/22 by DW
		theRequest.httpReturn (200, "application/json", jsontext.toString ());
		}
	function returnError (jstruct) {
		theRequest.httpReturn (500, "application/json", utils.jsonStringify (jstruct));
		}
	function returnNotFound () {
		theRequest.httpReturn (404, "text/plain", "Not found.");
		}
	function returnRedirect (url, code) { 
		var headers = {
			location: url
			};
		if (code === undefined) {
			code = 302;
			}
		theRequest.httpReturn (code, "text/plain", code + " REDIRECT", headers);
		}
		
	function httpReturn (err, returnedValue) {
		if (err) {
			returnError (err);
			}
		else {
			if (typeof returnedValue == "object") {
				returnData (returnedValue);
				}
			else {
				returnJsontext (returnedValue); //9/14/22 by DW
				}
			}
		}
	
	
	
	switch (theRequest.method) {
		case "POST":
			switch (theRequest.lowerpath) {
				default: 
					returnNotFound ();
					break;
				}
		case "GET":
			switch (theRequest.lowerpath) {
				case "/now": 
					theRequest.httpReturn (200, "text/plain", new Date ());
					return;
				case "/connect":
					console.log ("handleHttpRequest: params.redirect_url == " + params.redirect_url);
					getUrlForAuthorize (params.client_key, params.redirect_url, function (err, url) {
						if (err) {
							returnError (err);
							}
						else {
							returnRedirect (url);
							}
						});
					return;
				case "/getaccesstoken": 
					console.log ("\n/getaccesstoken: params.code == " + params.code + ", params.client_key == " + params.client_key);
					getAccessToken (params.code, params.client_key, httpReturn);
					return;
				
				case "/toot": //11/20/22 by DW
					console.log (utils.jsonStringify (params));
					tootStatus (params.access_token, params.client_key, params.status, params.inReplyTo, httpReturn);
					break;
				case "/getuserinfo": 
					getUserInfo (params.access_token, params.client_key, httpReturn);
					break;
				default: 
					returnNotFound ();
					break;
				}
			break;
		}
	
	
	
	
	}

readConfig (function () {
	console.log ("config == " + utils.jsonStringify (config));
	const httpConfig = {
		port: config.httpPort,
		flLogToConsole: config.flLogToConsole,
		flAllowAccessFromAnywhere: config.flAllowAccessFromAnywhere,
		flPostEnabled: config.flPostEnabled,
		blockedAddresses: config.blockedAddresses 
		};
	davehttp.start (httpConfig, handleHttpRequest);
	});


