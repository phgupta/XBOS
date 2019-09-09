$(document).ready(function() {
	M.AutoInit();

	var pipvals = ["12am", "2am", "4am", "6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm", "10pm", "12am"];
	var piprev = ["12am", "10pm", "8pm", "6pm", "4pm", "2pm", "12pm", "10am", "8am", "6am", "4am", "2am", "12am"];

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
	var dayToIndex = {"sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6, "dr": 7, "hol": 8};

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

	var colors = ["#018ae0", "#fdb515", "#b39ddb", "#fccde5", "#b2df8a", "#ff8a65"];
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
					safeToast("You cannot have more than 6 epochs", "rounded red", 2500);
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
				// console.log(row, col);
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

	function readIn(obj) {
		$("#groupName").prop("value", obj.group);
		$.each(obj["times"], function(i, v) {
			var ind = dayToIndex[i];
			var s = sliders[ind];
			var master = getMaster();
			if (ind == 0 || ind == 8) { master.pips = pips; }
			master.start = $.map(v, function(val) { return parseFloat(val); });
			counts[ind] = v.length + 1;
			var ts; (ts = []).length = counts[ind]; ts.fill(true);
			master.connect = ts;
			s.noUiSlider.destroy();
			noUiSlider.create(s, master);
		});
		setTop();
		$.each(obj["settings"], function(i, v) {
			sliderColors[dayToIndex[i]] = $.map(v, function(val) {
				if (val == null) { return "#CCC"; }
				else { return colors[val]; }
			});
			sliderModes[dayToIndex[i]] = v;
		});
		setColors();
		setConnects();
		setHandles();
		setTop();
		getConnect();
	}

	function findGroup(name) {
		var groupings = JSON.parse(localStorage.getItem("all-groupings"));
		for (var i in groupings) {
			if (groupings[i]["group"] == name) {
				return i;
			}
		}
	}

	var cgn = localStorage.getItem("curr-group-name");
	if (cgn != null) { readIn(JSON.parse(localStorage.getItem(cgn + "-group"))); }
	else { $("#groupName").prop("value", JSON.parse(localStorage.getItem("zones-for-group")).join(", ")); }

	function smartReadOut(name) {
		if (nameUsed(name)) { safeToast("Group name must be unique.", "rounded red"); return; }
		
		var obj = new Object();
		
		obj.group = name;
		
		var t = new Object();
		t.sun = $.extend([], sliders[0].noUiSlider.get());
		t.mon = $.extend([], sliders[1].noUiSlider.get());
		t.tue = $.extend([], sliders[2].noUiSlider.get());
		t.wed = $.extend([], sliders[3].noUiSlider.get());
		t.thu = $.extend([], sliders[4].noUiSlider.get());
		t.fri = $.extend([], sliders[5].noUiSlider.get());
		t.sat = $.extend([], sliders[6].noUiSlider.get());
		t.dr  = $.extend([], sliders[7].noUiSlider.get());
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
		sets.dr  = sliderModes[7];
		sets.hol = sliderModes[8];
		obj.settings = sets;
		
		var groupings = JSON.parse(localStorage.getItem("all-groupings"));
		var zfg = JSON.parse(localStorage.getItem("zones-for-group"));
		var cgn = localStorage.getItem("curr-group-name");
		if (zfg != null) {
			obj.zones = zfg;
			$.ajax({
				"url": "http://0.0.0.0:5000/api/create_grouping",
				"type": "POST",
				"dataType": "json",
				"contentType": 'application/json',
				"data": JSON.stringify(obj),
				"success": function(d) {
					console.log('/api/create_grouping success: ', d);
					localStorage.removeItem("zones-for-group");
					groupings.push(obj);
					localStorage.setItem("all-groupings", JSON.stringify(groupings));
					localStorage.setItem("curr-group-name", name);
					localStorage.setItem(name + "-group", JSON.stringify(obj));
					safeToast("Changes successfully updated.", "rounded");
				},
				"error": function(d) {
					console.log('/api/create_grouping error: ', d);
					safeToast("Changes could not be saved.", "red rounded");
				}
			});
		} else {
			obj.zones = JSON.parse(localStorage.getItem(cgn + "-group"))["zones"];
			// name == cgn check not needed but let's leave it
			if (name == cgn && JSON.stringify(obj) == localStorage.getItem(cgn + "-group")) {
				safeToast("No changes to be saved.", "rounded");
				return;
			}
			var ind = findGroup(cgn);
			// if (ind == null) { safeToast("Something went wrong.", "rounded red"); }
			// obj.original_group_name = cgn;
			groupings[ind] = obj;
			var dup = JSON.parse(JSON.stringify(obj));
			dup.original_group_name = cgn;
			$.ajax({
				"url": "http://0.0.0.0:5000/api/update_grouping",
				"type": "POST",
				"dataType": "json",
				"contentType": 'application/json',
				"data": JSON.stringify(dup),
				"success": function(d) {
					console.log('/api/update_grouping success: ', dup);
					if (name != cgn) { localStorage.removeItem(cgn + "-group"); }
					localStorage.setItem("all-groupings", JSON.stringify(groupings));
					localStorage.setItem("curr-group-name", name);
					localStorage.setItem(name + "-group", JSON.stringify(obj));
					safeToast("Changes successfully updated.", "rounded");
				},
				"error": function(d) {
					console.log('/api/update_grouping error: ', dup);
				}
			});
		}
	}

	function updateModes() {
		var modeObj = JSON.parse(localStorage.getItem("mode-settings"));
		if (modeObj == null) { window.location.href = "schedule-groupings.html"; }
		var modeDiv = $("#mode-div");
		var count = 0;
		for (var i in modeObj) {
			var curr = modeObj[i];
			modeDiv.append("<div style='background-color: " + colors[count] + ";' class='col s2 emode mode-card'><h4 id='mode" + count + "' class='mte'>" + curr["name"] + "</h4><div class='setpnt-div'><div class='red lighten-2 spl etab'>" + curr["heating"] + "</div><div class='blue lighten-2 spr etab'>" + curr["cooling"] + "</div></div></div>");
			if (count != 5) { modeDiv.append("<div class='col sml'></div>"); }
			count += 1;
		}
	} updateModes();

	function safeToast(s, c, t=5000) {
		var toastElement = document.querySelector('.toast');
		if (!toastElement) { M.toast({html: s, classes: c, displayLength: t}); }
	}

	function nameUsed(gn) {
		var groupings = JSON.parse(localStorage.getItem("all-groupings"));
		var cgn = localStorage.getItem("curr-group-name");
		for (var i in groupings) {
			if (groupings[i]["group"] == gn && groupings[i]["group"] != cgn) {
				return true;
			}
		}
		return false;
	}

	$("#apply-modes").click(function() {
		var gn = $("#groupName").prop("value").trim();
		if (gn.length < 3) {
			safeToast("Group Name must be at least 3 characters.", "rounded red");	
		} else if (gn.length > 20) {
			safeToast("Group Name must be 20 characters or fewer.", "rounded red");
		} else {
			smartReadOut(gn);
		}
	});
});
