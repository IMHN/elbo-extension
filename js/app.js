var clipboard = new Clipboard('.copy-button');

clipboard.on("success", function(e) {
	var jqelement = $(e.trigger);
	jqelement.attr("title", "Copied!").tooltip("show");
	setTimeout(function() {
		jqelement.attr("title", "").tooltip("destroy");
	}, 800);
});

chrome.tabs.query({
	"active": true,
	"lastFocusedWindow": true
}, function (tabs) {
	var tab_url = tabs[0].url;
	var result_area = $("#result-area");

	if (!/^https?:\/\/[^/]+/.test(tab_url)) {
		result_area.append($("<div/>", {
			"class": "well message-well centered-text"
		}).text("This link cannot be shortened."));

		return;
	}

	result_area.append($("<div/>", {
		"class": "well message-well centered-text"
	}).html('<i class="icon-arrows-cw animate-spin"></i> Crunching your link'));

	$.post("https://elbo.in/~shorten", {
		"url": tab_url
	}).done(function(data) {
		result_area.empty();

		if (data.status) {
			var fullshorturl = "https://elbo.in/" + data.shorturl;
			var enc_fullshorturl = encodeURIComponent(fullshorturl);
			var shorturl = "elbo.in/" + data.shorturl;

			result_area.append($("<h4/>", {
				"class": "centered-text short-link well"
			}).append($("<a/>", {
				"href": fullshorturl,
				"target": "_blank"
			}).text(shorturl)));

			var actions_row = $("<div/>", {
				"class": "row"
			});

			var share_col = $("<div/>", {
				"class": "col-xs-6 share-icons"
			});

			share_col.append($("<a/>", {
				"href": "https://www.facebook.com/sharer.php?u=" + enc_fullshorturl,
				"class": "icon-facebook-squared",
				"target": "_blank"
			}));

			share_col.append($("<a/>", {
				"href": "https://twitter.com/intent/tweet?url=" + enc_fullshorturl,
				"class": "icon-twitter-squared",
				"target": "_blank"
			}));

			share_col.append($("<a/>", {
				"href": "https://plus.google.com/share?url=" + enc_fullshorturl,
				"class": "icon-gplus-squared",
				"target": "_blank"
			}));

			share_col.append($("<a/>", {
				"href": "https://elbo.in/~qr/" + data.shorturl,
				"class": "icon-qrcode",
				"target": "_blank"
			}))

			var copy_col = $("<div/>", {
				"class": "col-xs-6"
			}).append($("<div/>", {
				"data-clipboard-text": fullshorturl,
				"class": "btn btn-primary col-xs-12 copy-button"
			}).html('<i class="icon-clone"></i> Copy link'));

			actions_row.append(share_col).append(copy_col);
			result_area.append(actions_row).append($("<div/>", {
				"class": "centered-text promo-text"
			}).html("For analytics and custom links, visit " +
			        '<a target="_blank" href="https://elbo.in/">elbo.in</a>'));
		}
		else if (data.reason === "invalid_url") {
			result_area.append($("<div/>", {
				"class": "well message-well centered-text"
			}).text("This link cannot be shortened."));
		}
		else if (data.reason === "ratelimited") {
			result_area.append($("<div/>", {
				"class": "well message-well centered-text"
			}).html("You have shortened too many URLs for now. Please visit " +
			        '<a target="_blank" href="https://elbo.in">elbo.in</a> to shorten more :)'));
		}
		else {
			result_area.append($("<div/>", {
				"class": "well message-well centered-text"
			}).html("Oops! Shortening that URL failed due to an unexpected error. If the problem persists, please " +
			        '<a target="_blank" href="https://www.booleanworld.com/contact-us">contact us</a>.'));
		}
	}).fail(function() {
		result_area.empty().append($("<div/>", {
				"class": "well message-well centered-text"
		}).html("Oops! Shortening that URL failed due to an unexpected error. If the problem persists, please " +
		        '<a target="_blank" href="https://www.booleanworld.com/contact-us">contact us</a>.'));
	});
});
