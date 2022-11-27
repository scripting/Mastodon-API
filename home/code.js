function startButtons () {
	const loginbutton = $("#idMastoSignonButton");
	loginbutton.click (function () {
		console.log ("Click");
		loginbutton.blur ();
		userLogin (mastoConsts.clientKey);
		});
	
	const signoffbutton = $("#idMastoSignoffButton");
	signoffbutton.click (function () {
		for (var x in mastoMemory) {
			mastoMemory [x] = undefined;
			}
		initMastoMemory ();
		saveMastoMemory ();
		});
	
	const mastotootbutton = $("#idMastoTootButton");
	mastotootbutton.click (function () {
		if (localStorage.lastTootString === undefined) {
			localStorage.lastTootString = "";
			}
		askDialog ("What would you like to toot?", localStorage.lastTootString, "Oh say can you toot.", function (tootableString, flcancel) {
			if (!flcancel) {
				localStorage.lastTootString = tootableString;
				postNewStatus (tootableString, undefined, function (err, data) {
					if (err) {
						alertDialog (err.message);
						}
					else {
						console.log ("mastotootbutton: data == " + jsonStringify (data));
						}
					});
				}
			});
		});
	
	const userinfobutton = $("#idUserinfoButton");
	userinfobutton.click (function () {
		getUserInfo (function (err, theInfo) {
			if (err) {
				alertDialog (err.message);
				}
			else {
				console.log (jsonStringify (theInfo));
				}
			});
		});
	}
function everySecond () {
	const flSignedOn = mastoMemory.access_token !== undefined;
	if (flSignedOn) {
		$("#idSignedOn").css ("display", "block");
		$("#idSignedOff").css ("display", "none");
		}
	else {
		$("#idSignedOn").css ("display", "none");
		$("#idSignedOff").css ("display", "block");
		}
	}
function startup () {
	
	console.log ("startup");
	restoreMastoMemory ();
	lookForOauthToken (); //if found it doesn't return
	startButtons ();
	self.setInterval (everySecond, 1000);
	}
