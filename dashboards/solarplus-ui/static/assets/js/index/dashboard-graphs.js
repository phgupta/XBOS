$(document).ready(function () {

    function consumption(value) {
        return (value);
    }

    /*
    * Graphs the total power consumption vs time
    * 
    * @author: Raja Vyshnavi Sriramoju
    * @param {Array of numbers} yVals - the power consumption values
    * @param {String} yValsTitle - the string for the y-axis title
    * @param {Array of Strings} dates - the dates for the power consumption values 
    */
    function renderChart1(yVals, yValsTitle, dates) {
        var highChart = new Highcharts.chart('chart1', {
            chart: {
                type: 'line',
                zoomType: "x"
            },
            title: {
                text: 'Total Power Consumption'
            },
            tooltip: {
                valueSuffix: ' kWh'
            },
            xAxis: {
                categories: dates
            },
            yAxis: {
                title: {
                    text: 'Consumption'
                },
                plotLines: [{
                    value: 0
                }],
                labels: {
                    format: '{value} kWh'
                }
            },
            series: [{
                    name: yValsTitle,
                    data: yVals
                }
            ]

        });
    }

    /*
    * Graphs the total power consumption vs time
    * 
    * @author: Raja Vyshnavi Sriramoju
    * @param {String} feature1 - the string for the y-axis title for 1st feature
    * @param {String} feature2 - the string for the y-axis title for 2nd feature
    * @param {Array of numbers} feature1Vals - the power consumption values for 1st feature
    * @param {Array of numbers} feature2Vals - the power consumption values for 2nd feature
    * @param {Array of Strings} dates - the dates for the power consumption values 
    */
    function renderChart2(feature1, feature2, feature1Vals, feature2Vals, dates) {
        var highChart = new Highcharts.chart('chart2', {
            chart: {
                type: 'column',
                zoomType: "x"
            },
            title: {
                text: 'HVAC Power Consumption'
            },
            tooltip: {
                valueSuffix: ' kWh'
            },
            xAxis: {
                categories: dates
            },
            yAxis: {
                title: {
                    text: 'Consumption'
                },
                plotLines: [{
                    value: 0
                }],
                labels: {
                    format: '{value} kWh'
                }
            },
            //series consists of the 2 features with names that are to be plotted
            series: [{
                    name: feature1,
                    data: feature1Vals
                },
                {
                    name: feature2,
                    data: feature2Vals
                }
            ]

        });
    }

    /*
    * Graphs the average power consumption vs time
    * 
    * @author: Raja Vyshnavi Sriramoju
    * @param {Array of numbers} yVals - the average power consumption values
    * @param {String} yValsTitle - the string for the y-axis title
    * @param {Array of Strings} dates - the dates for the power consumption values 
    */
    function renderChart3(yVals, yValsTitle, dates) {
        var highChart = new Highcharts.chart('chart3', {
            chart: {
                type: 'line',
                zoomType: "x"
            },
            title: {
                text: 'Average Power Consumed'
            },
            tooltip: {
                valueSuffix: ' kWh'
            },
            xAxis: {
                categories: dates
            },
            yAxis: {
                title: {
                    text: 'Power Consumed'
                },
                plotLines: [{
                    value: 0
                }],
                labels: {
                    format: '{value} kWh'
                }

            },
            series: [{
                    name: yValsTitle,
                    data: yVals
                }
            ]

        });
    }

    /*
    * Graphs the total power generation vs time
    * 
    * @author: Raja Vyshnavi Sriramoju
    * @param {Array of numbers} yVals - the power generated values
    * @param {String} yValsTitle - the string for the y-axis title
    * @param {Array of Strings} dates - the dates for the power consumption values 
    */
    function renderChart4(yVals, yValsTitle, dates) {
        var highChart = new Highcharts.chart('chart4', {
            chart: {
                type: 'line',
                zoomType: "x"
            },
            title: {
                text: 'Total Power Generated'
            },
            tooltip: {
                valueSuffix: ' kWh'
            },
            xAxis: {
                categories: dates
            },
            yAxis: {
                title: {
                    text: 'Power Generated'
                },
                plotLines: [{
                    value: 0
                }],
                labels: {
                    format: '{value} kWh'
                }

            },
            series: [{
                    name: yValsTitle,
                    data: yVals
                }
            ]

        });
    }

    /*
    * Request url and returns recieved data
    * 
    * @author: Raja Vyshnavi Sriramoju
    * @param {string} url for the flask server
    * @return {JSON} The prediction values from flask.
    */
    function Get(yourUrl) {
        var Httpreq = new XMLHttpRequest(); // a new request
        Httpreq.open("GET", yourUrl, false);
        Httpreq.send(null);
        return Httpreq.responseText;
    }

    /*
    * Fetches total power consumption data of the building from flask server and calls respective renderChart function
    * @author: Raja Vyshnavi Sriramoju
    */
    function graphDataCollection_Chart1() {

        // will have to include code here about fetching data from the 
        // selected features for the specific features on dashboard
        const feature = 'Building'
        const uri_chart1 = `http://127.0.0.1:5000/dashboard/access/${feature}`;
        var res_chart1 = JSON.parse(Get(uri_chart1));
        
        var buildingVals = [];
        labels = [];
        
        //res_chart1.length
        for (let i = 0; i < 500; i++) {
        
            let singleElement = res_chart1[i];
            //console.log(singleElement);
        
            for (let prop in singleElement) {
                if (prop == 'Building')
                {
                    buildingVals.push(singleElement[prop]);
                }
                if(prop == 'Time')
                {
                    labels.push(res_chart1[i].Time);
                }
            }           
        }
        renderChart1(buildingVals, 'Total Power Consumption Values', labels);

    }

    /*
    * Fetches power consumption data for two features from flask server and calls respective renderChart function
    * @author: Raja Vyshnavi Sriramoju
    */
    function graphDataCollection_Chart2() {

        const uri_chart1 = `http://127.0.0.1:5000/dashboard/access/HVAC1/HVAC2`;
        var res_chart1 = JSON.parse(Get(uri_chart1));
        
        var feature1Vals = [];
        var feature2Vals = []
        var labels = [];
        
        for (let i = 0; i < 500; i++) {

            let singleElement = res_chart1[i];

            for (let prop in singleElement) {
                if (prop == 'HVAC1')
                    feature1Vals.push(singleElement[prop]);
                if (prop == 'HVAC2')
                    feature2Vals.push(singleElement[prop]);
            }
            labels.push(res_chart1[i].Time);

        }
        renderChart2('HVAC1', 'HVAC2', feature1Vals, feature2Vals, labels);

    }

    /*
    * Fetches average power consumption from flask server and calls respective renderChart function
    * @author: Raja Vyshnavi Sriramoju
    */
    function graphDataCollection_Chart3() {

        const uri_chart1 = `http://127.0.0.1:5000/dashboard/access/Building/average`;
        var res_chart1 = JSON.parse(Get(uri_chart1));
        
        var avgPowerVals = [];
        labels = [];

        //res_chart1.length
        for (let i = 0; i < res_chart1.length; i++) {
        
            let singleElement = res_chart1[i];
        
            for (let prop in singleElement) {
                if (prop == 'Building')
                {
                    avgPowerVals.push(singleElement[prop]);
                }
                if(prop == 'Time')
                {
                    labels.push(res_chart1[i].Time);
                }
                
            }           
        }
        console.log(labels);
        renderChart3(avgPowerVals, 'Average Power Consumed Values', labels);

    }

    /*
    * Fetches total power generated values from flask server and calls respective renderChart function
    * @author: Raja Vyshnavi Sriramoju
    */
    function graphDataCollection_Chart4() {

        const uri_chart1 = `http://127.0.0.1:5000/dashboard/PVPowerGenData`;
        var res_chart1 = JSON.parse(Get(uri_chart1));
        
        var PVGenVals = [];
        labels = [];
        
        //res_chart1.length
        for (let i = 0; i < 500; i++) {
        
            let singleElement = res_chart1[i];
            //console.log(singleElement);
        
            for (let prop in singleElement) {
                if (prop == 'PVPower_kW')
                {
                    PVGenVals.push(singleElement[prop]);
                }
                labels.push(res_chart1[i].Date_PT);
            }           
        }
        renderChart4(PVGenVals, 'Total Power Generated Values', labels);

    }
    //making the function calls so that call is made as soon as html page loads
    graphDataCollection_Chart1();
    graphDataCollection_Chart2();
    graphDataCollection_Chart3();
    graphDataCollection_Chart4();

});