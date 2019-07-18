$(document).ready(function() {
	M.AutoInit();
	var passAlong = sessionStorage.getItem("groupname");
	if (!passAlong) {
		$("#groupName").prop("value", "Untitled");
	}
	// sessionStorage.setItem("modesToGroup", passAlong);
	// var cname = $("#groupName").prop("value");
	// if (passAlong) {
	// 	console.log(passAlong);
	// 	console.log(cname);
	// 	if (cname != passAlong) {
	// 		$("#groupName").prop("value", passAlong);
	// 		sessionStorage.setItem("modesToGroup", "");
	// 	}
	// }
	// let c = ["pink", "deep-orange", "green", "teal", "blue", "deep-purple", "tp-blue"];
	let pipvals = ["12am", "2am", "4am", "6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm", "10pm", "12am"];
	let piprev = ["12am", "10pm", "8pm", "6pm", "4pm", "2pm", "12pm", "10am", "8am", "6am", "4am", "2am", "12am"];

	pips = {
		mode: "values",
		values: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
		density: 2
	}

	function getMaster() {
		return {
			start: [8.0, 18.0],
			connect: [true, true, true],
			range: {'min': 0.0, 'max': 24.0},
			step: .25,
			behaviour: "drag"
		}
	}

	var counts; (counts = []).length = 9; counts.fill(3);
	var sliders = [];
	var sliderColors = [["#CCC", "#CCC", "#CCC"],["#CCC", "#CCC", "#CCC"],
						["#CCC", "#CCC", "#CCC"],["#CCC", "#CCC", "#CCC"],
						["#CCC", "#CCC", "#CCC"],["#CCC", "#CCC", "#CCC"],
						["#CCC", "#CCC", "#CCC"],["#CCC", "#CCC", "#CCC"],
						["#CCC", "#CCC", "#CCC"]];
	var sliderModes =  [[null, null, null],[null, null, null],
						[null, null, null],[null, null, null],
						[null, null, null],[null, null, null],
						[null, null, null],[null, null, null],
						[null, null, null]];

	$(".sched-slider").each(function(i) {
		var master = getMaster();
		if (i == 0 || i == 8) { master.pips = pips; }
		noUiSlider.create(this, master);
		sliders.push(this);
	});

	function setTop() {
		$(".noUi-pips-horizontal").each(function(i) {
			if (i == 0) {
				$(this).css("top", "-80px").css("transform", "rotate(180deg)");
				$(".noUi-value-large").each(function(j) {
					if (j < 13) { $(this).css("transform", "rotate(180deg)").css("margin-left", "-17px").css("margin-top", "16px"); }
				});
				$('.noUi-value.noUi-value-horizontal.noUi-value-large').each(function(j) {
					var l = pipvals;
					if (j < 13) { l = piprev; }
					$(this).html(l[j % 13]);
				});
			}
		});
	} setTop();

	var edit = false;
	function schedClick(c=true) {
		var x = $("#sched-btn");
		x.removeClass("scale-in");
		x.addClass("scale-out");
		edit = !edit;
		if (edit) {
			var s = "save";
			if (c) { sliders.forEach(function(elem) { elem.setAttribute("disabled", true); });}
		} else {
			var s = "edit";
			if (c) { sliders.forEach(function(elem) { elem.removeAttribute("disabled"); });}
		}
		setTimeout(function() {
			x.html("<i class='large material-icons right'>" + s + "</i>" + s);
			x.removeClass("scale-out");
			x.addClass("scale-in");
			clearTimeout(this);
		}, 250);
		if (c && mode) { editModes(false); }
	} $("#sched-btn").click(schedClick);

	function myfix(lst) {
		return lst.map(function(x) {
			return parseFloat(Math.floor(x)) + parseFloat(Math.floor(((x%1)+.13)/.25))*.25;
		});
	}

	var colors = ["#018AE0", "#FDB515", "#cab2d6", "#fccde5", "#b2df8a"];
	var curMode = 0;
	var curColor = colors[0];
	$(".with-gap").each(function(i) {
		$(this).click(function() {
			curMode = i;
			curColor = colors[i];
		});
	});

	function getConnect() {
		$(".noUi-connect").each(function(i) {
			$(this).click(function() {
				var row = 0; var sum = 0;
				while (sum < i + 1) { sum += counts[row]; row += 1; } row -= 1;
				if (row == 0) { var col = i; } else { var col = i - sum + counts[row]; }
				if (!edit) {
					if (sliderColors[row][col] == curColor) {
						$(this).css("background", "#CCC");
						sliderColors[row][col] = "#CCC";
						sliderModes[row][col] = null;
					} else {
						$(this).css("background", curColor);
						sliderColors[row][col] = curColor;
						sliderModes[row][col] = curMode;
					}
					// console.log(sliderColors);
				}
				// console.log(row, col);
			});
		});
	} getConnect();

	var location;
	function readIn() {
		// location = "Basketball Courts";
		$("#location").append(location);
	} readIn();

    // Get all inputs from user in schedule-epochs page and store it in database.
    // TODO: How to get the Group Name of zone?
	function readOut() {

		var obj = new Object();
		// obj.name = location;
		// obj.zones = [1, 3, 5, 7];
		// obj.modes = [];
		// $(".mode-card").each(function(i) {
		// 	var m = new Object();
		// 	m.id = i;
		// 	var inputs = $(this).find("input");
		// 	m.name = inputs[0].value;
		// 	m.heating = inputs[1].value;
		// 	m.cooling = inputs[2].value;
		// 	m.enabled = $(inputs[3]).prop("checked");
		// 	obj.modes.push(m);
		// });

		var t = new Object();
		t.sun = $.extend([], sliders[0].noUiSlider.get());
		t.mon = $.extend([], sliders[1].noUiSlider.get());
		t.tue = $.extend([], sliders[2].noUiSlider.get());
		t.wed = $.extend([], sliders[3].noUiSlider.get());
		t.thu = $.extend([], sliders[4].noUiSlider.get());
		t.fri = $.extend([], sliders[5].noUiSlider.get());
		t.sat = $.extend([], sliders[6].noUiSlider.get());
		t.dr = $.extend([], sliders[7].noUiSlider.get());
		t.hol = $.extend([], sliders[8].noUiSlider.get());
		obj.times = t;

		var sets = new Object();
		sets.sun = sliderModes[0];
		sets.mon = sliderModes[1];
		sets.tue = sliderModes[2];
		sets.wed = sliderModes[3];
		sets.thu = sliderModes[4];
		sets.fri = sliderModes[5];
		sets.sat = sliderModes[6];
		sets.dr = sliderModes[7];
		sets.hol = sliderModes[8];
		obj.settings = sets;

        // Create data object to be saved to database
        var data = new Object();
        data.times = t;
        data.settings = sets;
        data.group_name = 'Area 51'

        console.log('data: ', data)
        console.log('JSON.stringify(data): ', JSON.stringify(data))

		// console.log('epoch settings: ', obj);
		// console.log('Group Name', $("#groupName").value)
		// console.log('passAlong: ', passAlong)

        // Save epochs and group name to database
		$.ajax({
            "url": "http://0.0.0.0:5000/api/save_mode",
            "type": "post",
            "dataType": "json",
            "headers": {"Content-Type": "application/json"},
            "data": JSON.stringify(data),
            "success": function(d) {
                console.log("success: ", d);
            },
            "error": function(d) {
                console.error("error: ", d)
            }
        })

	}

    // This is the save icon button on the bottom right corner of schedule-epochs page
	$("#apply-modes").click(function() {
		M.toast({html: 'Preferences saved and modes applied.', classes:"rounded", displayLength: 5000});
		readOut();
	});

	function setColors() {
		$(".noUi-connect").each(function(i) {
			var row = 0; var sum = 0;
			while (sum < i + 1) { sum += counts[row]; row += 1; } row -= 1;
			if (row == 0) { var col = i; } else { var col = i - sum + counts[row]; }
			$(this).css("background", sliderColors[row][col]);
		});
	} setColors();

	function setConnects() {
		$(".noUi-connect").each(function(i) {
			$(this).unbind();
			$(this).click(function() {
				if (!edit) { return; }
				var row = 0; var sum = 0;
				while (sum < i + 1) { sum += counts[row]; row += 1; } row -= 1;
				if (row == 0) { var col = i; } else { var col = i - sum + counts[row]; }
				var s = sliders[row];
				var l = s.noUiSlider.get();
				if (!$.isArray(l)) { l = [l]; }
				else if (l.length == 5) {
					var toastElement = document.querySelector('.toast');
					if (toastElement) {
  						var toastInstance = M.Toast.getInstance(toastElement);
						toastInstance.dismiss();
					}
					M.toast({html: "You cannot have more than 6 epochs", classes: "rounded", displayLength: 2500});
					return;
				}
				l = l.map(function(x) { return parseFloat(x); });
				var last = counts[row] - 1;
				if (col == 0) {
					if (l[0] <= 2.5) { l.splice(0, 0, 0.0); }
					else { l.splice(0, 0, (l[0]/2.0)); }
					sliderColors[row].splice(0, 0, sliderColors[row][0]);
					sliderModes[row].splice(0, 0, sliderModes[row][0]);
				} else if (col == last) {
					if (l[last - 1] >= 22.5) { l.push(24.0); }
					else { l.push((24.0 + l[last - 1])/2.0); }
					sliderColors[row].push(sliderColors[row][sliderColors[row].length - 1]);
					sliderModes[row].push(sliderModes[row][sliderModes[row].length - 1]);
				} else {
					// https://stackoverflow.com/questions/586182/how-to-insert-an-item-into-an-array-at-a-specific-index
					l.splice(col, 0, (l[col] + l[col - 1])/2.0);
					sliderColors[row].splice(col, 0, sliderColors[row][col]);
					sliderModes[row].splice(col, 0, sliderModes[row][col]);
				}
				l = l.map(function(x) { return x.toString(); });
				var opts = getMaster();
				opts.start = l;
				var ts; (ts = []).length = l.length + 1; ts.fill(true); opts.connect = ts;
				if (row == 0 || row == 8) {
					opts.pips = pips;
				}
				s.noUiSlider.destroy();
				noUiSlider.create(s, opts);
				counts[row] += 1;
				setColors();
				setConnects();
				setHandles();
				setTop();
				getConnect();
			});
		});
	} setConnects();

	function setHandles() {
		$(".noUi-handle").each(function(i) {
			$(this).unbind();
			$(this).click(function() {
				if (!edit) { return; }
				var row = 0; var sum = 0;
				while (sum < i + 1) { sum += counts[row] - 1; row += 1; } row -= 1;
				if (row == 0) { var col = i; } else { var col = i - sum + counts[row] - 1; }
				var s = sliders[row];
				var l = s.noUiSlider.get();
				if (!$.isArray(l)) { return; }
				console.log(row, col);
				// https://davidwalsh.name/remove-item-array-javascript
				l.splice(col, 1);
				if (sliderColors[row][col] == sliderColors[row][col+1]) {
					sliderColors[row].splice(col, 1);
					sliderModes[row].splice(col, 1);
				} else {
					sliderColors[row].splice(col, 2, "#CCC");
					sliderModes[row].splice(col, 2, null);
				}
				var opts = getMaster();
				opts.start = l;
				var ts; (ts = []).length = l.length + 1; ts.fill(true); opts.connect = ts;
				if (row == 0 || row == 8) {
					opts.pips = pips;
				}
				s.noUiSlider.destroy();
				noUiSlider.create(s, opts);
				counts[row] -= 1;
				setColors();
				setConnects();
				setHandles();
				setTop();
				getConnect();
			});
		});
	} setHandles();

	getConnect();

	function getOpts() { return {range: {'min': 0.0, 'max': 24.0}, step: .25, behaviour: "tap-drag"}; }

	var mode = false;
	function editModes(c=true) {
		var x = $("#mode-edit");
		x.removeClass("scale-in");
		x.addClass("scale-out");
		mode = !mode;
		if (mode) {
			$("#mode-radios").show();
			if (c) { sliders.forEach(function(elem) { elem.setAttribute("disabled", true); });}
			var s = "save";
		} else {
			$("#mode-radios").hide();
			if (c) { sliders.forEach(function(elem) { elem.removeAttribute("disabled"); });}
			var s = "edit";
		}
		setTimeout(function() {
			x.html("<i class='large material-icons right'>" + s + "</i>" + s);
			x.removeClass("scale-out");
			x.addClass("scale-in");
			clearTimeout(this);
		}, 250);
		if (c && edit) { schedClick(false); }
	} $("#mode-edit").click(editModes);

	function getEdit() { if (mode) { return "save"; } else { return "edit"; }}
});
