const myVersion = "0.4.0", myProductName = "mastoserver"; 

const fs = require ("fs");
const request = require ("request");
const davehttp = require ("davehttp");
const utils = require ("daveutils");

var config = {
	clientKey: undefined, //11/16/22 by DW
	clientSecret: undefined,
	myAccessToken: undefined,
	urlMastodonServer: undefined,
	urlRedirect: undefined,
	urlRedirectForUser: "http://localhost:1401/blagooey", //the page we send the user back to once they're logged in
	
	httpPort: process.env.PORT || 1401,
	myDomain: "localhost",
	flLogToConsole: true,
	flAllowAccessFromAnywhere: true, //1/2/18 by DW
	flPostEnabled: false, //1/3/18 by DW
	
	};

function readConfig (callback) {
	fs.readFile ("config.json", function (err, jsontext) {
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
			s += x + "=" + paramtable [x];
			}
		}
	return (s);
	}
function getUrlForAuthorize (urlRedirect) {
	const path = "oauth/authorize";
	const params = {
		client_id: config.clientKey,
		redirect_uri: config.urlRedirect,
		response_type: "code",
		scope: "read+write+follow",
		force_login: true
		};
	const url = config.urlMastodonServer + path + "?" + buildParamList (params, false);
	console.log ("getUrlForAuthorize: url == " + url);
	return (url);
	}
function getAccessToken (codeFromMasto, callback) {
	const path = "oauth/token";
	const params = {
		grant_type: "client_credentials",
		client_id: config.clientKey,
		client_secret: config.clientSecret,
		redirect_uri: config.urlRedirectForUser,
		scope: "read+write+follow",
		code: codeFromMasto
		};
	const url = config.urlMastodonServer + path + "?" + buildParamList (params, false);
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
	function returnError (jstruct) {
		theRequest.httpReturn (500, "application/json", utils.jsonStringify (jstruct));
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
	
	
	switch (theRequest.lowerpath) {
		case "/now": 
			theRequest.httpReturn (200, "text/plain", new Date ());
			return;
		case "/connect":
			returnRedirect (getUrlForAuthorize (params.redirect_url));
			return;
		case "/callbackfrommastodon":
			getAccessToken (params.code, function (err, data) {
				console.log (utils.jsonStringify (params));
				returnPlainText (utils.jsonStringify (params));
				});
			return;
		case "/getaccesstoken": 
			getAccessToken (params.code, httpReturn);
			return;
		case "/blagooey":
			returnRedirect ("httblagooey");
			return;
		
		
		
		}
	
	theRequest.httpReturn (404, "text/plain", "Not found.");
	}

const httpConfig = {
	port: config.httpPort,
	flLogToConsole: config.flLogToConsole,
	flAllowAccessFromAnywhere: config.flAllowAccessFromAnywhere,
	flPostEnabled: config.flPostEnabled,
	blockedAddresses: config.blockedAddresses //4/17/18 by DW
	};

readConfig (function () {
	console.log ("config == " + utils.jsonStringify (config));
	davehttp.start (httpConfig, handleHttpRequest);
	});


