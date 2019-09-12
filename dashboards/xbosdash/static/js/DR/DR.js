$(document).ready(function() {
	M.AutoInit();

	var allZones = JSON.parse(localStorage.getItem("all-zones"));
	var numZones;
	var zonesToInd = new Object();

	function cleanUp(s) { return s.replace("hvac_zone_", "").replace("_", " "); }

	function getZones() {
		$.ajax({
			"url": "http://0.0.0.0:5000/api/get_zones",
			"type": "GET",
			"dataType": "json",
			"success": function(d) {
				allZones = $.map(d["success"], cleanUp);
				localStorage.setItem("all-zones", JSON.stringify(allZones));
				numZones = allZones.length;
				setZoneCards();
			},
			"error": function(d) {
				// console.log("something went wrong!")
				d = {zones: ["North 1", "South 1", "East 1", "West 1", "North 2", "South 2", "East 2", "West 2", "North 3", "South 3", "East 3", "West 3", "North 4", "South 4", "East 4", "West 4", "North 5 Basketball", "North 6 Basketball", "South 5 Basketball", "South 6", "East 5", "East 6", "West 5", "West 6"]};
				allZones = d["zones"];
				localStorage.setItem("all-zones", JSON.stringify(allZones));
				setZoneCards();
			}
		});
	}

	function setZoneCards() {
		var azlen = allZones.length
		var ztext = " zone";
		if (azlen != 1) { ztext += "s"; }
		$("#sort-by-text").html("Sort <b>" + allZones.length + "</b>" + ztext);
		var s = "<div class='row' style='display: flex; flex-wrap: wrap; justify-content: space-between;'>";
		$.each(allZones, function(i, v) {
			zonesToInd[v] = i;
			zonesToInd[i] = v;
			s += "<div id='z" + i + "card' class='col s5-5 zone-card z-depth-1' style='order: " + i + ";'>";
			s += "<h6 id='z" + i + "note' class='znote' style='margin-bottom: 0;'></h6>";
			s += "<h4 class='center-align' style='margin-bottom: 0;' id='z" + i + "banner'>" + v + "</h4>";
			s += "<p class='range-field'><input id='z" + i + "range' class='simrange center-align' type='range' min='0' max='1' value='0.50' step='0.01'/></p>";
			s += "<div style='display: flex; justify-content: space-between;'>";
			s += "<h5 id='z" + i + "date' class='grey-text' style='margin-top: 0;'>Historical</h5>";
			s += "<a id='z" + i + "btn' style='margin-left: 11px;' class='waves-effect waves-light btn-small zbtn'>Run</a>";
			s += "<h5 style='margin-top: 0;'>Simulation</h5>";
			s += "</div>";
			s += "<div class='row'></div>";
			s += "<div style='display: flex;'>";
			s += "<h5 id='z" + i + "hislam' class='zrow zone-his-val hislam grey-text left-align'>____</h5>"; //z" + i + "-val
			s += "<h5 class='center-align zcard-field'>Cost-Comfort Index</h5>";
			s += "<h5 id='z" + i + "simlam' class='zrow right-align' >0.50</h5>";
			s += "</div>";
			s += "<div style='display: flex;'>";
			s += "<h5 id='z" + i + "hisdis' class='zrow zone-his-val hisdis grey-text left-align'>____</h5>"; //z" + i + "-val
			s += "<h5 class='center-align zcard-field'>Discomfort</h5>";
			s += "<h5 id='z" + i + "simdis' class='zrow simdis purple-text right-align text-darken-5'>____</h5>"; //z" + i + "-val
			s += "</div>";
			s += "<div style='display: flex;'>";
			s += "<h5 id='z" + i + "hisdol' class='zrow zone-his-val hisdol grey-text left-align'>____</h5>"; //z" + i + "-val
			s += "<h5 class='center-align zcard-field'>$ Saved</h5>";
			s += "<h5 id='z" + i + "simdol' class='zrow simdol green-text right-align text-darken-1'>____</h5>"; //z" + i + "-val
			s += "</div>";
			s += "<div style='display: flex;'>";
			s += "<h5 id='z" + i + "hiskWH' class='zrow zone-his-val hiskWH grey-text left-align'>____</h5>"; //z" + i + "-val
			s += "<h5 class='center-align zcard-field'>kWh Saved</h5>";
			s += "<h5 id='z" + i + "simkWH' class='zrow simkWH orange-text right-align text-darken-1'>____</h5>"; //z" + i + "-val
			s += "</div>";
			s += "<div style='display: flex;'>";
			s += "<h5 id='z" + i + "hisdeg' class='zrow zone-his-val hisdeg grey-text left-align'>____</h5>"; //z" + i + "-val
			s += "<h5 class='center-align zcard-field'>Cooling Degree-Hrs</h5>";
			s += "<h5 id='z" + i + "simdeg' class='zrow simdeg blue-text right-align text-darken-1'>____</h5>"; //z" + i + "-val
			s += "</div>";
			s += "</div>";
		});
		s += "</div>";
		$("#zone-config").append(s);
	}

	if (allZones == null) { getZones(); } else { numZones = allZones.length; setZoneCards(); }

	var checked = true;
	// $("#bvz").click(mySwitch);
	function mySwitch(x) {
		checked = x;
		if (!checked) {
			$("#switch-bldng").addClass("black-text");
			$("#switch-zone").removeClass("black-text");
			$("#zone-chart").hide();
			$("#bldng-chart").show();
			$("#zone-config").hide();
			$("#bldng-config").show();
		} else {
			$("#switch-zone").addClass("black-text");
			$("#switch-bldng").removeClass("black-text");
			$("#bldng-chart").hide();
			$("#zone-chart").show();
			$("#bldng-config").hide();
			$("#zone-config").show();
		}
		checked = !checked;
		$("#checkbox").prop("checked", checked);
	} mySwitch(checked);

	$("#my-div").click(function(event) { event.stopImmediatePropagation(); $("#checkbox").prop("checked", checked); });
	$("#label").click(function(event) { event.stopImmediatePropagation(); $("#checkbox").prop("checked", checked); });
	$("#checkbox").click(function(event) { event.stopImmediatePropagation(); $("#checkbox").prop("checked", checked); });

	function unbind() { $("#switch-bldng").unbind(); $("#switch-zone").unbind(); $("#lever").unbind(); }
	
	function enableBZSwitch() {
		unbind();
		$("#switch-bldng").click(function(event) { event.stopImmediatePropagation(); mySwitch(false); });
		$("#switch-zone").click(function(event) { event.stopImmediatePropagation(); mySwitch(true); });
		$("#lever").click(function(event) { event.stopImmediatePropagation(); mySwitch(checked); });
		$("#checkbox").prop("disabled", "");
		setTextColor(checked, $("#switch-bldng"), $("#switch-zone"));
		$("#switch-zone").css("cursor", "pointer");
		$("#switch-bldng").css("cursor", "pointer");
	}
	enableBZSwitch();

	function disableBZSwitch() {
		unbind();
		$("#switch-bldng").click(function(event) { event.stopImmediatePropagation(); $("#checkbox").prop("checked", checked); });
		$("#switch-zone").click(function(event) { event.stopImmediatePropagation(); $("#checkbox").prop("checked", checked); });
		$("#lever").click(function(event) { event.stopImmediatePropagation(); $("#checkbox").prop("checked", checked); });
		$("#checkbox").prop("disabled", "disabled");
		$("#switch-zone").removeClass("black-text");
		$("#switch-bldng").removeClass("black-text");
		$("#switch-zone").css("cursor", "default");
		$("#switch-bldng").css("cursor", "default");
	}

	function asDesSwitch(x) {
		if (sb != "normal") {
			asDesChecked = x;
			$("#as-des-checkbox").prop("checked", asDesChecked);
			setTextColor(asDesChecked, $("#switch-des"), $("#switch-as"));
			mySort(sb);
		}
	}

	function simHisSwitch(x) {
		if (sb != "normal" && sb != "alph") {
			simHisChecked = x;
			$("#sim-his-checkbox").prop("checked", simHisChecked);
			setTextColor(simHisChecked, $("#switch-his"), $("#switch-sim"));
			mySort(sb);
		}
	}

	function setTextColor(x, a, b) {
		if (x) { a.addClass("black-text"); b.removeClass("black-text"); }
		else { a.removeClass("black-text"); b.addClass("black-text"); }
	}

	function disableSimHis() {
		$("#sim-his-checkbox").prop("disabled", "disabled");
		$("#switch-his").css("cursor", "default").removeClass("black-text");
		$("#switch-sim").css("cursor", "default").removeClass("black-text");
	}

	function disableSwitches() {
		$("#as-des-checkbox").prop("disabled", "disabled");
		$("#sim-his-checkbox").prop("disabled", "disabled");
		$(".mySwitch").each(function() {
			$(this).css("cursor", "default").removeClass("black-text");
		});
	}

	function enableSwitches() {
		$("#as-des-checkbox").prop("disabled", "");
		$("#sim-his-checkbox").prop("disabled", "");
		setTextColor(asDesChecked, $("#switch-des"), $("#switch-as"));
		setTextColor(simHisChecked, $("#switch-his"), $("#switch-sim"));
		$(".mySwitch").each(function() { $(this).css("cursor", "pointer"); });
	}

	var asDesChecked = false;
	$("#as-des-div").click(function(event) { event.stopImmediatePropagation(); $("#as-des-checkbox").prop("checked", asDesChecked); });
	$("#as-des-label").click(function(event) { event.stopImmediatePropagation(); $("#as-des-checkbox").prop("checked", asDesChecked); });
	$("#as-des-checkbox").click(function(event) { event.stopImmediatePropagation(); $("#as-des-checkbox").prop("checked", asDesChecked); });
	$("#switch-as").click(function(event) { event.stopImmediatePropagation(); asDesSwitch(false); });
	$("#switch-des").click(function(event) { event.stopImmediatePropagation(); asDesSwitch(true); });
	$("#as-des-lever").click(function(event) { event.stopImmediatePropagation(); asDesSwitch(!asDesChecked); });

	var simHisChecked = false;
	$("#sim-his-div").click(function(event) { event.stopImmediatePropagation(); $("#sim-his-checkbox").prop("checked", simHisChecked); });
	$("#sim-his-label").click(function(event) { event.stopImmediatePropagation(); $("#sim-his-checkbox").prop("checked", simHisChecked); });
	$("#sim-his-checkbox").click(function(event) { event.stopImmediatePropagation(); $("#sim-his-checkbox").prop("checked", simHisChecked); });
	$("#switch-sim").click(function(event) { event.stopImmediatePropagation(); simHisSwitch(false); });
	$("#switch-his").click(function(event) { event.stopImmediatePropagation(); simHisSwitch(true); });
	$("#sim-his-lever").click(function(event) { event.stopImmediatePropagation(); simHisSwitch(!simHisChecked); });

	function myFix(x) {
		if (x > 1) { return x; }
		if (x == 0) { return "0.0"; }
		if (x == 1) { return "1.0"; }
		x = x.toString();
		if (x.length < 4) { return x + "0"; }
		return x;
	}

	$("#sim-lam-range").each(function() {
		var x = $("#sim-lam");
		this.oninput = function() {
			x.html(myFix(this.value));
			// clearBldng();
		};
	});

	var sb = "normal";
	$(".sort-li").each(function(i, v) {
		$(this).click(function() {
			selAndSet($(".sort-li"), v, $("#sort-btn"));
			sb = v.id;
			mySort(v.id);
		});
	});

	function selAndSet(selClass, v, btn) {
		selClass.each(function() { $(this).removeClass("active"); });
		$(v).addClass("active");
		if ($(v).text() == "None") { btn.text("Historical"); return false; }
		else { btn.text($(v).text()); return true; }
	}

	function mySort(x) {
		var r = [];
		if (x == "normal") {
			disableSwitches();
			for (var i = 0; i < numZones; i += 1) { r.push(i); }
		} else {
			var toRet = [];
			enableSwitches();
			if (x == "alph") { disableSimHis(); x = "banner"; }
			else if (!simHisChecked) { x = "sim" + x; }
			else { x = "his" + x; }
			for (var i = 0; i < numZones; i += 1) {
				var toAdd = new Object();
				toAdd.id = i;
				toAdd.val = parseFloat($("#z" + i + x).text());
				toRet.push(toAdd);
			}
			toRet.sort(myCompare);
			for (var i = 0; i < numZones; i += 1) { r.push(toRet[i].id); }
			if (asDesChecked) { r.reverse(); }
		}
		for (var i = 0; i < numZones; i += 1) { $("#z" + r[i] + "card").css("order", i); }
	}

	// $("#")
	
	// https://stackoverflow.com/posts/1129270
	function myCompare(a, b) {
		if (a.val < b.val) { return -1; }
		if (a.val > b.val) { return 1; }
		return 0;
	}

	function getTodayDate() {
	    // Return today's date in ISO format. e.g. '2019-07-18'
        return new Date().toISOString().substr(0, 10);
	}

	$(".simrange").each(function() {
		var x = $("#" + this.id.replace("range", "simlam"));
		this.oninput = function() {
			x.html(myFix(this.value));
			// $("#" + this.id.replace("range", "card")).addClass("grey");
			// setLamAvg();
			// clearZone(this.id.replace("range", ""));
			// clearSummary();
		};
	});


	function safeToast(s, c, t=5000) {
		var toastElement = document.querySelector('.toast');
		if (!toastElement) { M.toast({html: s, classes: c, displayLength: t}); }
	}

	var buildingRequest = null;
    // This is the function when "Run" button is clicked in the DR page.
	$("#bldng-btn").click(function() {
		bldngChart.showLoading();
		$("#bldng-config").hide();
		$("#sim-loader").show();
		// https://stackoverflow.com/questions/2275274/
		setTimeout(function() { $('html, body').animate({ scrollTop: '0px' }, 200) }, 10);
		disableBZSwitch();
		safeToast("Please allow the simulation a few minutes <button id='cancel-sim' class='btn-flat toast-action'>Cancel</button>", "", 1000000);
		$("#cancel-sim").click(function() { postSim("bldng"); });
		// var toRet = new Object();
		// toRet.isBuilding = true;
		// toRet.date = new Date().getTime();
		var lambdaValue = parseFloat($("#sim-lam-range").prop("value")).toString();
		// console.log("simulation input?", toRet);

        // TODO: start from NOW, go until midnight tonight
        buildingRequest = $.ajax({
            "url": "http://0.0.0.0:5000/api/simulationREMOVE/" + lambdaValue + "/" + getTodayDate(),
            "success": function(d) {
                // console.log("simulation", d);
                var a = processResp(d);
                for (var x = 0; x < a.length; x += 1) { bldngChart.addSeries(a[x], false); }
                // $("#bldng-reset").addClass("scale-in");
                // simSuccess(bldngChart, "bldng");
                // bldngChart.hideLoading();
                bldngChart.redraw();
            },
            "error": function(d) {
                console.log("url: ", "http://0.0.0.0:5000/api/simulation/" + lambdaValue + "/" + getTodayDate());
                console.error("simulation error: ", d);
            },
            "complete": function(d) {
            	// simSuccess(zoneChart, "zone");
	            setTimeout(function() { simSuccess(bldngChart, "bldng"); }, 1500);
            }
        });
		// return toRet;
	});

	function processResp(j) {
		var toRet = [];
		for (var z in j) {
			var lst = [];
			// var prevKeys = [];
			var st;
			for (var s in j[z]) {
				// console.log(z);
				// console.log(j[z])
				// console.log(s);
				// console.log("");
				var toAdd = new Object();
				toAdd.id = clean(z).toLowerCase() + " sim-" + s;
				toAdd.name = toAdd.id;
				// console.log(toAdd)
				if (s == "state") {
					// toAdd.data = j[z][s];
					// st = toAdd;
				} else {
					// var ret = makeData(j[z][s], toAdd.id);
					// toAdd.data = ret[0];
					// var k = ret[1];
					// if (k.length > prevKeys.length) { prevKeys = k; }
					toAdd.data = makeData(j[z][s], toAdd.id);
					lst.push(toAdd);
				}
			}
			// var cleaned = clean(z); lst[0].name = cleaned; lst[0].id = cleaned;
			// this represents the original zone
			var cleaned = clean(z);
			// st.data = makeState(st.data, prevKeys, st.id);
			// st.yAxis = 1;
			// st.step = "center";
			// lst.push(st);
			for (var i = 0; i < lst.length; i += 1) {
				// if (i != 0) { lst[i].linkedTo = cleaned; }
				lst[i].linkedTo = cleaned;
				lst[i].dashStyle = lines[i];
				lst[i].color = c[i];
				lst[i].lineWidth = ws[i];
			}
			if (!toRet.length) { lst[0].visible = true; }
			else { lst[0].visible = false; }
			$.merge(toRet, lst);
		}
		return toRet;
	}

	function makeData(j, n) {
		var toRet = [];
		// var ret = [];
		for (var k in j) {
			// console.log(k);
			// console.log(j);
			// console.log(n);
			// ret.push(k);
			var toAdd = new Object();
			toAdd.name = getTime(k/1000, 5);
			toAdd.id = n + " " + toAdd.name;
			toAdd.y = myRound(j[k], 2);
			toRet.push(toAdd);
		}
		// return [toRet, ret];
		// console.log(toRet);
		return toRet;
	}

	function clean(s, shorten=false, amt=null) {
		s = s.replace("-", "_");
		s = s.split("_");
		if (shorten && amt) { for (var i in s) { if (s[i].length > amt) { s[i] = s[i].slice(0, amt); }}}
		for (var i in s) { s[i] = s[i].charAt(0).toUpperCase() + s[i].slice(1).toLowerCase(); }
		s = s.join("");
		s = s.replace("Zone", "").replace("ZONE", "").replace("zone", "");
		s = s.replace("HVAC", "").replace("Hvac", "").replace("hvac", "");
		return s;
	}

	// http://www.jacklmoore.com/notes/rounding-in-javascript/
	function myRound(val, dec) { return Number(Math.round(val+'e'+dec)+'e-'+dec); }

	function getTime(et, x) { return toDate(et).toString().split(" ")[4].slice(0, x); }

	function toDate(et) {
		var d = new Date(0);
		d.setUTCSeconds(et);
		return d;
	}

	let c = ["#42A5F5", "#EF5350", "#66bb6a", "#8d6e63", "#000000", "#e6194b", "#008080", "#911eb4", "#0082c8"];
	let lines = ["ShortDot", "ShortDot", "ShortDot", "ShortDot", "Solid", "ShortDash", "Dot", "ShortDot", "Solid"];
	let ws = [2, 2, 2, 2, 2, 2, 2, 2, 2];
	let CLEN = 9;

	var zoneRequest = null;
	$(".zbtn").each(function(i) {
		$(this).click(function() {
			zoneChart.showLoading();
			$("#zone-config").hide();
			$("#sim-loader").show();
			// console.log(i);
			// https://stackoverflow.com/questions/2275274/
			setTimeout(function() { $('html, body').animate({ scrollTop: '0px' }, 200) }, 10);
			disableBZSwitch();
			safeToast("Please allow the simulation a few minutes <button id='cancel-sim' class='btn-flat toast-action'>Cancel</button>", "", 1000000);
			$("#cancel-sim").click(function() { postSim("zone"); });

			var lambdaValue = parseFloat($("#z" + i + "range").prop("value")).toString();

			zoneRequest = $.ajax({
	            "url": "http://0.0.0.0:5000/api/simulation/" + lambdaValue + "/" + getTodayDate() + "/" + zonesToInd[i],
	            "success": function(d) {
	                // // console.log("simulation", d);
	                // var a = processResp(d);
	                // for (var x = 0; x < a.length; x += 1) { zoneChart.addSeries(a[x], false); }
	                // // $("#zone-reset").addClass("scale-in");
	                // // zoneChart.hideLoading();
	                // zoneChart.redraw();
	                // d = {"hvac_zone_back_hallway": {"cooling": {"1565938800000": 30, "1565939700000": 30, "1565940600000": 30, "1565941500000": 30, "1565942400000": 30}, "heating": {"1565938800000": 30, "1565939700000": 30, "1565940600000": 30, "1565941500000": 30, "1565942400000": 30}, "inside": {"1565938800000": 66.0, "1565939700000": 65.75279985906522, "1565940600000": 65.43783332903159, "1565941500000": 65.25098112112512, "1565942400000": 65.45344733595263}, "outside": {"1565938800000": 30, "1565939700000": 30, "1565940600000": 30, "1565941500000": 30, "1565942400000": 30}, "state": {"1565938800000": "off", "1565939700000": "off", "1565940600000": "off", "1565941500000": "off", "1565942400000": "off"}}};
	            	console.log(d);
	            	if (d["error"]) { return; }
	            	var a = processResp(d);
	            	console.log(a);
	            	for (var x = 0; x < a.length; x += 1) { zoneChart.addSeries(a[x], false); }
	            	zoneChart.redraw();

	                console.log("url success: ", "http://0.0.0.0:5000/api/simulation/" + lambdaValue + "/" + getTodayDate() + "/" + zonesToInd[i]);
	                console.error("simulation success: ", d);
	                // setTimeout(function() { console.log("ignore") }, 1000);
	            },
	            "error": function(d) {
	            	d = {"hvac_zone_back_hallway": {"cooling": {"1565938800000": 30, "1565939700000": 30, "1565940600000": 30, "1565941500000": 30, "1565942400000": 30}, "heating": {"1565938800000": 30, "1565939700000": 30, "1565940600000": 30, "1565941500000": 30, "1565942400000": 30}, "inside": {"1565938800000": 66.0, "1565939700000": 65.75279985906522, "1565940600000": 65.43783332903159, "1565941500000": 65.25098112112512, "1565942400000": 65.45344733595263}, "outside": {"1565938800000": 30, "1565939700000": 30, "1565940600000": 30, "1565941500000": 30, "1565942400000": 30}, "state": {"1565938800000": "off", "1565939700000": "off", "1565940600000": "off", "1565941500000": "off", "1565942400000": "off"}}};
	            	console.log(d);
	            	var a = processResp(d);
	            	console.log(a);
	            	for (var x = 0; x < a.length; x += 1) { zoneChart.addSeries(a[x], false); }
	            	zoneChart.redraw();

	                console.log("url error: ", "http://0.0.0.0:5000/api/simulationREMOVE/" + lambdaValue + "/" + getTodayDate() + "/" + zonesToInd[i]);
	                console.error("simulation error: ", d);
	                // setTimeout(function() { console.log("ignore") }, 1000);
	            },
	            "complete": function(d) {
	            	// simSuccess(zoneChart, "zone");
	            	setTimeout(function() { simSuccess(zoneChart, "zone"); }, 1500);
	            }
       		});
		// var toRet = new Object();
		// toRet.isBuilding = false;
		// toRet.date = new Date().getTime();
		// toRet.lam = [];
		// var toAdd;
		// var notes = [];
		// $(".simrange").each(function(i) {
			// toAdd = new Object();
			// toAdd.id = i;
			// toAdd.val = parseFloat($(this).prop("value"));
			// toRet.lam.push(toAdd);
			// notes.push(toAdd.val);
		// });
		// setTimeout(function() {
		// 	simSuccess(zoneChart, "zone");
		// 	$(".zone-card").each(function() { $(this).removeClass("grey"); });
		// 	var i = 0;
		// 	$(".znote").each(function() { $(this).html("values shown are for λ=" + myFix(notes[i])); i += 1; });
		// }, 500);
		// console.log(toRet);
		// return toRet;
		});
	});

	function simSuccess(x, y) {
		x.hideLoading();
		// x.setTitle({ text: "Simulated" });
		// x.setTitle({ text: "Simulated" }, { text: "Simulated streams are dotted" });
		postSim(y);
	}

	function postSim(x) {
		if (buildingRequest) { buildingRequest.abort(); }
		if (zoneRequest) { zoneRequest.abort(); }
		M.Toast.dismissAll();
		$("#sim-loader").hide();
		$("#" + x + "-config").show();
		enableBZSwitch();
	}

	// function chooseBVZ(d) { if (d.isBuilding) { setBldngData(d); } else { setZoneData(d); }}

	// function setZoneData(d, b=false) {
	// 	var x;
	// 	var id;
	// 	var s; if (b) { s = "his"; } else { s = "sim"; }
	// 	var lamvals = [];
	// 	var disvals = [];
	// 	var dolvals = [];
	// 	var kWHvals = [];
	// 	for (var i in d.vals) {
	// 		x = d.vals[i];
	// 		id = x.id;
	// 		$("#z" + id + s + "lam").html(x.lam); lamvals.push(x.lam);
	// 		$("#z" + id + s + "dis").html(x.dis); disvals.push(x.dis);
	// 		$("#z" + id + s + "dol").html(x.dol); dolvals.push(x.dol);
	// 		$("#z" + id + s + "kWH").html(x.kWH); kWHvals.push(x.kWH);
	// 	}
	// 	var l = lamvals.length;
	// 	var lamsum = lamvals.reduce((pv, cv) => pv+cv, 0);
	// 	var dissum = disvals.reduce((pv, cv) => pv+cv, 0);
	// 	var dolsum = dolvals.reduce((pv, cv) => pv+cv, 0);
	// 	var kWHsum = kWHvals.reduce((pv, cv) => pv+cv, 0);
	// 	$("#" + s + "-lam-avg").html(lamsum/l);
	// 	$("#" + s + "-dis-avg").html(dissum/l);
	// 	$("#" + s + "-money-avg").html(dolsum/l);
	// 	$("#" + s + "-energy-avg").html(kWHsum/l);
	// }

	function setBldngData(d, b=false) {
		var s;
		if (b) { s = "historic"; } else { s = "sim"; }
		$("#" + s + "-lam").html(d.lam);
		$("#" + s + "-dis").html(d.dis);
		$("#" + s + "-money-savings").html(d.dol);
		$("#" + s + "-energy-savings").html(d.kWH);
		$("#" + s + "-cooling-degrees").html(d.deg);
	}

	// https://stackoverflow.com/posts/1129270
	function dateSort(a, b) {	
		if (a.date < b.date) { return -1; }
		if (a.date > b.date) { return 1; }
		return 0;
	}

	var histArr = JSON.parse(sessionStorage.getItem("historical-dr"));

	function getHist() {
		$.ajax({
			"url": "http://0.0.0.0:5000/api/historical_DR",
			"type": "GET",
			"dataType": "json",
			"success": function(d) {
				console.log("magic! this endpoint doesn't even exist!");
			},
			"error": function(d) {
				// console.log("hi");
				d = [{date: 1533705708847, lam: 0.5, dol: 5, dis: 1, kWH: 8, deg: 18}, {date: 1531705708847, lam: 0.4, dol: 7, dis: 2, kWH: 10, deg: 12}, {date: 1535705708847, lam: 0.87, dol: 3, dis: 5, kWH: 9, deg: 0}];
				histArr = d.sort(dateSort);;
				sessionStorage.setItem("historical-dr", JSON.stringify(histArr));
				setHist();
			}
		});
	}
	
	function setHist() {
		var a = "<li class='his-sel active'><a>None</a></li>";
		for (var i in histArr) {
			a += "<li id='hist" + i + "' class='his-sel'><a>" + toMDY(histArr[i].date).toString() + "</a></li>";
			// } else { b += "<li id='hist" + i + "' class='zone-his-sel'><a>" + toMDY(d[i].date).toString() + "</a></li>"; }
		}
		$("#date-dropdown").html(a);
		// $("#zone-date-dropdown").append(b);
		
		$(".his-sel").each(function(i, v) {
			$(this).click(function() {
				if (selAndSet($(".his-sel"), v, $("#historic-date"))) { setBldngData(histArr[i-1], true); }
				else { clearBldngHist(); }
			});
		});
	}

	if (histArr == null) { getHist(); } else { setHist(); }

	// $(".zone-his-sel").each(function(i, v) {
	// 	$(this).click(function() {
	// 		if (selAndSet($(".zone-his-sel"), v, $("#zone-historic-date"))) {
	// 			setZoneData(histArr[parseInt($(v)[0].id.replace("hist", ""))], true);
	// 		} else {
	// 			// clearSummaryHist();
	// 			clearZoneHistAll();
	// 		}
	// 	});
	// });

	function toMDY(et) {
		var d = new Date(0);
		d.setUTCSeconds(et/1000);
		return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
	}

	// function clearSummary() { $(".sum-val").each(function() { $(this).html("_____"); });}
	// function clearSummaryHist() { $(".sum-his-val").each(function() { $(this).html("_____"); });}
	// function clearZone(x) { $(".z" + x + "-val").each(function() { $(this).html("____"); });}
	function clearZoneHistAll() { $(".zone-his-val").each(function() { $(this).html("____"); });}
	function clearBldng() { $(".bldng-val").each(function() { $(this).html("_____"); });}
	function clearBldngHist() { $(".bldng-his-val").each(function() { $(this).html("_____"); });}

	// function setSummaryVals() {
	// 	setSumVal(".hislam", "#his-lam-avg", true);
	// 	setSumVal(".hisdis", "#his-dis-avg", true);
	// 	setSumVal(".simdis", "#sim-dis-avg", true);
	// 	setSumVal(".hisdol", "#his-money-avg", false);
	// 	setSumVal(".simdol", "#sim-money-avg", false);
	// 	setSumVal(".hiskWH", "#his-energy-avg", false);
	// 	setSumVal(".simkWH", "#sim-energy-avg", false);
	// }

	// function setLamAvg() {
	// 	var x = 0;
	// 	$(".simrange").each(function() { x += parseFloat(this.value); });
	// 	x = (x / numZones).toFixed(2);
	// 	$("#sim-lam-avg").html(myFix(x));
	// }

	// function setSumVal(s, k, b) {
	// 	var x = 0;
	// 	$(s).each(function() { x += parseFloat($("#" + this.id).html()); });
	// 	if (b) { x = (x / l).toFixed(2); }
	// 	$(k).html(myFix(x));
	// }
});
				
