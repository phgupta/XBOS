var bldngChart;
$(document).ready(function() {
	// works for up to 9 series
	let c = ["#42A5F5", "#EF5350", "#66bb6a", "#8d6e63", "#000000", "#e6194b", "#008080", "#911eb4", "#0082c8"];
	let lines = ["Solid", "Solid", "Solid", "Solid", "Solid", "ShortDash", "Dot", "ShortDot", "Solid"];
	let ws = [3, 3, 3, 3, 2, 2, 2, 2, 2];
	let CLEN = 9;

	function getTime(et, x) { return toDate(et).toString().split(" ")[4].slice(0, x); }

	function toDate(et) {
		var d = new Date(0);
		d.setUTCSeconds(et);
		return d;
	}

	// http://www.jacklmoore.com/notes/rounding-in-javascript/
	function round(val, dec) { return Number(Math.round(val+'e'+dec)+'e-'+dec); }

	function processResp(j) {
		var toRet = [];
		for (var z in j) {
			var lst = [];
			// var prevKeys = [];
			var st;
			for (var s in j[z]) {
				var toAdd = new Object();
				toAdd.id = clean(z).toLowerCase() + " " + s;
				toAdd.name = toAdd.id;
				if (s == "state") {
					// toAdd.data = j[z][s];
					// st = toAdd;
				} else {
					// var ret = makeData(j[z][s], toAdd.id);
					// toAdd.data = ret[0];
					toAdd.data = makeData(j[z][s], toAdd.id);
					// var k = ret[1];
					// if (k.length > prevKeys.length) { prevKeys = k; }
					lst.push(toAdd);
				}
			}
			var cleaned = clean(z); lst[0].name = cleaned; lst[0].id = cleaned;
			// st.data = makeState(st.data, prevKeys, st.id);
			// st.yAxis = 1;
			// st.step = "center";
			// lst.push(st);
			for (var i = 0; i < lst.length; i += 1) {
				lst[i].dashStyle = lines[i];
				lst[i].color = c[i];
				lst[i].lineWidth = ws[i];
			}
			// console.log(lst);
			if (!toRet.length) { lst[0].visible = true; }
			else { lst[0].visible = false; }
			$.merge(toRet, lst);
		}
		// console.log(toRet);
		return toRet;
	}

	// function processPower(j) {
	// 	var toRet = [];
	// 	for (var z in j) {
	// 		// console.log(z);
	// 	}
	// }

	// make multiple series maybe
	function makeState(j, l, n) {
		var toRet = [];
		var prev = null;
		var col = null;
		var r;
		for (var k in l) {
			var toAdd = new Object();
			toAdd.name = getTime(l[k]/1000, 5);
			toAdd.id = n + " " + toAdd.name;
			if (l[k] in j) {
				r = stateClean(j[l[k]]);
				prev = round(r[0], 2);
				// col = r[2];
			}
			// toAdd.color = col;
			toAdd.y = prev;
			toAdd.id += " " + r[1];
			toRet.push(toAdd);
		}
		return toRet;
	}

	function stateClean(x) {
		if (x == "off") { return [-2, "off", "#424242"]; }
		if (x == "heat stage 1") { return [2, "he1", "#e57373"]; }
		if (x == "heat stage 2") { return [0, "he2", "#e53935"]; }
		if (x == "cool stage 1") { return [0, "co1", "#64b5f6"]; }
		if (x == "cool stage 2") { return [0, "co2", "#1976d2"]; }
	}

	function makeData(j, n) {
		var toRet = [];
		// var ret = [];
		for (var k in j) {
			// ret.push(k);
			var toAdd = new Object();
			toAdd.name = getTime(k/1000, 5);
			toAdd.id = n + " " + toAdd.name;
			toAdd.y = round(j[k], 2);
			toRet.push(toAdd);
		}
		// return [toRet, ret];
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

	function pointFormatter() {
		// if ("state" in this) {
			// last 3 chars
			// return this.id.toString().reverse().slice(3).reverse();
		// }
		// if (state in $(this).id) { return "sdf"; }
		// else {
		var s = "<span style=\"color:" + this.color + "\">\u25CF</span>" + this.id.split(" ")[1] + ": " + this.y + "<br/>";
		// https://stackoverflow.com/questions/6408140/how-jquery-can-parse-colors-in-text
		s = s.replace(/#(?:[0-9a-f]{3}){1,2}/gim, "$&");
		// console.log(s);
		return s;
		// return "<span style='font-size: 14px;'>" + this.id.split(" ")[1] + this.y + "<br/>";
		// }
    }

	var options = {
		"chart": {
			"resetZoomButton": {
				"theme": {
					"display": "none"
				}
			},
			"zoomType": "x",
			"animation": false,
			"renderTo": "bldng-DR",
			"events": {
				"load": function(e) {
					$.ajax({
						"url": "http://0.0.0.0:5000/api/hvac/day/in/15m",
						"type": "GET",
						"dataType": "json",
						"error": function(d) {
                            console.log("Error: ", d);
						},
						"success": function(d) {
							// console.log(d);
							var a = processResp(d);
							// console.log(a);
							// for (var x = 0; x < a.length; x += 1) { bldngChart.addSeries(a[x], false); }
							bldngChart.addSeries(a[0], false);
							bldngChart.addSeries(a[1], false);
							bldngChart.addSeries(a[2], false);
							bldngChart.addSeries(a[3], false);
							// $("#bldng-reset").addClass("scale-in");
							bldngChart.hideLoading();
							bldngChart.redraw();
                        }
						// ,
						// "complete": function(d) {
						// 	$.ajax({
						// 		//"url": "http://127.0.0.1:5000/api/hvac/day/15mzsdf",
						// 		"url": "http://0.0.0.0:5000/api/power/day/in/15m",
						// 		"type": "GET",
						// 		"dataType": "json",
						// 		"success": function(d) {
      //                               var a = processPower(d);
      //                           },
						// 		"error": function (d) {
						// 			//var d = { "site": "avenal-animal-shelter", "date": "07-19-2018", "cost": { 	"actual": 17.23, 	"baseline:": 57.80 }, "baseline-type": "Linear Regression", "degree-hours": { 	"cooling": 5,  	"heating": 0 }, "rmse": 1234, "actual": { "1531987200000": 8288.0, "1531988100000": 6176.0, "etc...": 123123 }, "baseline": {"1531987200000": 6112.2582947533,"1531988100000": 5886.2757730824, "etc...": 123089}};
						// 			//var a = processPower(d);
						// 			// var a = processResp(d);
						// 			// console.log(a);
						// 			//console.log("hi");
      //                               console.error(d)
						// 		},
						// 		"complete": function(d) {
						// 			bldngChart.hideLoading();
						// 			bldngChart.redraw();
						// 		}
						// 	});
						// }
					});
				}
			}
		},
		"title": {
			"text": "Baseline"
		},
		"loading": {
			"hideDuration": 0,
			"showDuration": 0,
			"style": {
				"opacity": .75
			}
		},
		"xAxis": [
			{
				"id": "myXAxis",
				"type": "category",
				"plotBands": {
					"color": "#F7B4B6",
					"from": 1*4,
					"to": 2*4
				}
				// ,
				// "tickInterval": 4
			}
		],
		"yAxis": [
			{
				"title": { "text": "°F" },
				// "height": 225
			}
			// ,
			// {
				// "height": 60,
				// "top": 300,
				// "visible": false
			// }
			// ,
			// {
				// "title": { "text": "kW" },
				// "height": 225,
				// "opposite": true
			// }
		],
		"credits": {
			"enabled": false
		},
		"legend": {
			"enabled": false
		},
		"plotOptions": {
			"line": {
				"marker": {
					"enabled": false,
				}
			},
			"series": {
				"stickyTracking": true,
				"states": {
					"hover": {
						"enabled": false
					}
				}
				// ,
				// "events": {
					// "legendItemClick": function () {
						// var s = this.chart.series;
						// for (var i = 0; i < s.length; i += 1) {
							// s[i].hide();
						// }
						// bldngChart.setTitle(null, { text: "Zone: " + this.name} );
						// return true;
					// }
				// }
			}
		},
		"tooltip": {
			"headerFormat": '<span style="font-size:14px">{point.key}</span><br/>',
			"pointFormatter": pointFormatter,
			"hideDelay": 500,
			"shared": true,
			"crosshairs": true,
			"padding": 6
		},
		"series": []
	};

	bldngChart = new Highcharts.Chart(options);
	bldngChart.showLoading();

	$('#bldng-reset').click(function() { bldngChart.xAxis[0].setExtremes(null, null); });
});

