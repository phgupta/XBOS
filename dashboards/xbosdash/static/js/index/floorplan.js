$(document).ready(function() {
	/* sets #floorplan's html to an svg of the floorplan */
	// $.get("static/img/svg.svg", function(svg) {
 //    	$("#floorplan").html(svg);
	// }, "text");

	$.ajax({
        // make sure file exists. replace 'ciee' with name of building (underscores)
        "url": '/svg/ciee.svg',
        "success": function(data) {
            // console.log(data);
            $("#floorplan").html(data)
        }
    });
	
	/* spinning loader for the heating, cooling, off accordian */
	$("#hvac").hide();
	$("#hvac-loader").show();
	$("#hvac-loader").addClass("scale-in");

	// (TODO) can't use this once override is allowed
	// unless zone names are already shortened
	function cleanUp(s) { return s.replace("hvac_zone_", "").replace("_", " "); }

	/* null first element because svg attributes are indexed from 1 */
	var zoneNames = [null];

	var setpts = [[]];
	$.ajax({
		"url": "http://0.0.0.0:5000/api/hvac",
		"type": "GET",
		"dataType": "json",
		"success": function(d) {
			// console.log(d);
			// console.log(d);
			for (var o in d) {
				// console.log(o);
				zoneNames.push(cleanUp(o));
				// zoneNames.push(o);
			}
			// console.log(zoneNames);
			/* gets rid of the loader and shows the accordian */
			$("#hvac-loader").addClass("scale-out");
			$("#hvac").addClass("scale-in");
			$("#hvac-loader").hide();
			$("#hvac").show();

			/* see processResp below */
			var ret = processResp(d);

			/* checks to see which tabs in the accordian are NOT empty so that they can be automatically opened */
			var bools = [];
			ret.forEach(function(v) {
				if (!v.length) {
					v[0] = "None";
					bools.push(false);
				} else {
					bools.push(true);
				}
			});
			var divs = [$("#heatingDiv"), $("#coolingDiv"), $("#offDiv"), $("#lightingDiv")];
			var instance = M.Collapsible.getInstance($("#hvac-dropdown"));
			setZones(ret, bools, divs, instance);
		},
		"complete": function(d) {
			var zones = [];
			var hvacs = [];
			// TODO: fix this
			var i = 1;
			var z = $("#zone" + i);
			var h = $("#HVAC-" + i);
			while (i < zoneNames.length + 1) {
				zones.push([z, i]);
				hvacs.push(h);
				i += 1;
				z = $("#zone" + i);
				h = $("#HVAC-" + i);
			}

			zones.forEach(function(v) {
				v[0].hover(function() {
					myHover(0);
					v[0].find('span').each(function() { $(this).css("opacity", .5); });
					hvacs[v[1] - 1].css("opacity", 1);
				}, function() {
					myHover(1);
					v[0].find('span').each(function() { $(this).css("opacity", 1); });
				});
			});

			function myHover(num) { hvacs.forEach(function(v) { v.css("opacity", num); });}
		}
	});

	function safeToast(s, c, t=5000) {
		var toastElement = document.querySelector('.toast');
		if (!toastElement) { M.toast({html: s, classes: c, displayLength: t}); }
	}
	
	var tb = true;
	$("#tempbtn").click(function() {
		var x = $(this);
		var ret = [];
		var v; var zt; var change;
		if (tb) {
			y = "save";
			$(".zonestemp").each(function() {
				$(this).replaceWith("<div id='" + this.id + "' class='right-align col s3 zonestemp'><input class='my-input' type='number' max=90 min=35 value='" + $(this).html().replace("°", "") + "' /></div>");
			});
			$(".zoneName").each(function(i, v) {
				$(this).replaceWith("<span class='col s9 zoneName left-align' id='" + this.id + "'>" + this.id + "</span>");
			});
		} else {
			y = "override";
			$(".zonestemp").each(function() {
				v = myclean($(this).find("input").prop("value"));
				zt = parseInt(this.id.replace("zt", ""));
				change = getChange(v, zt);
				ret.push({id: this.id.replace("zt", ""), val: v, setpoint: change});
				$(this).replaceWith("<span id='" + this.id + "' class='col s5 zonestemp right-align'>" + v + "°</span>");
			});
			$(".zoneName").each(function(i, v) {
				$(this).replaceWith("<span class='col s7 zoneName left-align' id='" + this.id + "'>" + this.id + "</span>");
			});
		}
		x.removeClass("scale-in");
		x.addClass("scale-out");
		setTimeout(function() {
			if (y == "override") {
				x.html("<i id='tempicon' class='material-icons right'>" + "edit" + "</i>" + y);	
			} else {
				x.html("<i id='tempicon' class='material-icons right'>" + y + "</i>" + y);
			}
			x.removeClass("scale-out");
			x.addClass("scale-in");
			clearTimeout(this);
		}, 250);
		if (!tb) { console.log(ret); safeToast("Your preferences have been applied.", ""); }
		tb = !tb;
	});

	function getChange(v, zt) {
		var sp = setpts[zt];
		if (Math.abs(v - sp[0]) < Math.abs(v - sp[1])) { return "heating"; } else { return "cooling"; }
	}

	function myclean(x) {
		x = Math.floor(x);
		if (x < 35) { return 35; }
		if (x > 90) { return 90; }
		return x;
	}

	function processResp(d) {
		/* a list of lists, one for each of heating, cooling, off, and lighting (not currently used) */
		var toRet = [[], [], [], []];
		
		/* no lighting, so we start at i == 1 */
		var i = 1;

		/* iterating through each object */
		for (var x in d) {
			
			/* o is the current object */
			var o = d[x];

			/* have to do something different for lighting */
			if (i == 0) {
				// TODO: create relevant function for getting lighting information
				// var r = getLightingInfo();
			} else {
				/* used to determine whether a zone is heating or cooling at the moment */
				setpts.push([o.heating_setpoint, o.cooling_setpoint]);
				
				/* see makeHTML below */
				var r = makeHTML(o.cooling, o.heating, o.tstat_temperature, i);
			}
			i += 1;
			toRet[r[0]].push(r[1]);
		}
		return toRet;
	}

	function makeHTML(c, h, t, i) {
		var toRet = [];
		if (h) { toRet.push(0); }
		else if (c) { toRet.push(1); }
		else { toRet.push(2); }
		// toRet.push("<div class='row zones valign-wrapper' id='zone" + i + "'><span class='col s7 left-align'>Zone " + i + "</span><span id='zt" + i + "' class='col s5 zonestemp right-align'>" + myclean(t.toString()) + "°</span></div>");
		toRet.push("<div class='row zones valign-wrapper' id='zone" + i + "'><span class='col s7 zoneName left-align' id='" + zoneNames[i] + "'>" + zoneNames[i] + "</span><span id='zt" + i + "' class='col s5 zonestemp right-align'>" + myclean(t.toString()) + "°</span></div>");
		return toRet;
	}

	function setZones(r, b, d, i) {
		for (var x in r) {
			d[x].append(r[x].join(""));
			if (b[x]) { i.open(x); }
		}
	}
});
