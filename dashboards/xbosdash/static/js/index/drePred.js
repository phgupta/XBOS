$(document).ready(function() {
	let dotw = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	setTimeout(function() { $("#forecast-loader").hide(); $("#forecast-row").css("display", "flex").show(); }, 500);

	function safeToast(s, c, t=5000) {
		var toastElement = document.querySelector('.toast');
		if (!toastElement) { M.toast({html: s, classes: c, displayLength: t}); }
	}

	function setPred() {
		$.ajax({
			"url": "http://0.0.0.0:5000/api/prediction/dr",
			"type": "GET",
			"dataType": "json",
			"success": function(d) {
				var days = d.days;
				var s = "";
				days.forEach(function(elem) {
					s += "<div class='z-depth-1 center-align forecast-card " + getColor(elem.likelihood) + "'><h6>" + getDate(elem.date) + "</h6><h6>event " + elem.likelihood + "</h6></div>";
				});
				$("#forecast-loader").hide();
				$("#forecast-row").html(s);
			},
			"error": function(d) {
				safeToast("Prediction data could not be loaded.", "red");
			}
		});
	} setPred();

	function getColor(l) {
		if (l == "unlikely") { return "blue-grey lighten-1" }
		else if (l == "possible") { return "yellow"; }
		else if (l == "likely") { return "orange"; }
		else if (l == "confirmed") { return "red"; }
	}

	function getDate(e) {
		var d = new Date(0);
		d.setUTCSeconds(e);
		var x = d.toString().split(" ");
		return dotw[d.getDay()] + ", " + x[1] + " " + x[2];
	}

});
