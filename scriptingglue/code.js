const appConsts = {
	urlMastodonServer: "http://social.scottfr.ee/"
	};

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
function servercall (path, params, flAuthenticated, callback, urlServer=appConsts.urlMastodonServer) {
	var whenstart = new Date ();
	if (params === undefined) {
		params = new Object ();
		}
	if (flAuthenticated) { //1/11/21 by DW
		params.oauth_token = localStorage.twOauthToken;
		params.oauth_token_secret = localStorage.twOauthTokenSecret;
		}
	var url = urlServer + path + "?" + buildParamList (params, false);
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
function serverpost (path, params, flAuthenticated, filedata, callback, urlServer=appConsts.urlMastodonServer) {
	var whenstart = new Date ();
	if (!$.isPlainObject (filedata) && (typeof (filedata) != "string")) { //8/2/21 by DW
		filedata = filedata.toString ();
		}
	if (params === undefined) {
		params = new Object ();
		}
	if (flAuthenticated) { //1/11/21 by DW
		params.oauth_token = localStorage.twOauthToken;
		params.oauth_token_secret = localStorage.twOauthTokenSecret;
		}
	var url = urlServer + path + "?" + buildParamList (params, false);
	$.post (url, filedata, function (data, status) {
		if (status == "success") {
			if (callback !== undefined) {
				callback (undefined, data);
				}
			}
		else {
			var err = {
				code: status.status,
				message: JSON.parse (status.responseText).message
				};
			if (callback !== undefined) {
				callback (err);
				}
			}
		});
	}

function getServerInfo (callback) {
	servercall ("api/v1/instance", undefined, undefined, callback);
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

function startup () {
	console.log ("startup");
	}
