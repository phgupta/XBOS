$(document).ready(function() {
	M.AutoInit();
	var zoneSel = 0;
	var zoneArr = [];

	$(".filled-in").each(function() {
		$(this).click(function() {
			var t = $(this).find("span").prevObject["0"]["labels"][0]["innerText"];
			if ($(this).prop("checked")) {
				zoneSel += 1;
				zoneArr.push(t);
			} else {
				zoneSel -= 1;
				zoneArr.splice($.inArray(t, zoneArr), 1);
			}
			setGB();
		});
		var t = $(this).find("span").prevObject["0"]["labels"][0]["innerText"];
		if ($(this).prop("checked")) {
			zoneSel += 1;
			zoneArr.push(t);
		}
		setGB();

		// CHECK: TEMP!! Making sure that /api/get_mode works.
		$.ajax({
            "url": "http://0.0.0.0:5000/api/get_mode",
            "success": function(d) {
                console.log("/api/get_mode success: ", d);
            },
            "error": function(d) {
                console.error("error: ", d)
            }
        })

	});

	function setGB() { $("#group-btn").html("Group Selected (" + zoneSel + ")"); }

	$("#group-btn").click(function() {
		if (zoneSel == 0) {
			$("#modal-continue").addClass("disabled");
			$("#modal-header").html("Select at least one zone to form a group");
			$("#modal-text").html("");
		} else {
			$("#modal-continue").removeClass("disabled");
			var s = "Form a group with the following ";
			if (zoneSel == 1) { s += "zone:"; } else { s += zoneSel + " zones:"; }
			$("#modal-header").html(s);
			$("#modal-text").html(zoneArr.join("<br>"));
		}
	});

	$("#modal-continue").click(function() {
		sessionStorage.setItem("modes", zoneArr);
		sessionStorage.setItem("groupname", "");
		location.href = "schedule-epochs.html";
	});

    // This is the save button on the schedule page to the right of "Current Modes"
	$("#save-modes").click(function() {
		var obj = new Object();
		obj.modes = [];
		$(".mode-card").each(function(i) {
			var m = new Object();
			m.id = i;
			var inputs = $(this).find("input");
			m.name = inputs[0].value;
			m.heating = inputs[1].value;
			m.cooling = inputs[2].value;
			m.enabled = $(inputs[3]).prop("checked");
			obj.modes.push(m);
		});
		M.toast({html: 'Current modes successfully updated.', classes:"rounded", displayLength: 2000});
		console.log(obj);
	});
});
