$(document).ready(function () {

    function consumption(value) {
        return (value);
    }

    /*
    * Graphs the temperature, days, and solar power
    * 
    * @author: Raja Vyshnavi Sriramoju
    * @param {Array of numbers} predictedSolarVals
    * @param {Array of numbers} tempVals - the max temperatures for the following week
    * @param {Array of Strings} daysArray - the days of the week starting from the next day 
    */
    function renderChart(predictedSolarVals, tempVals, daysArray) {
        var highChart = new Highcharts.chart('predictionChart', {
            chart: {
                zoomType: "xy"
            },
            title: {
                text: 'Predicted Solar production values'
            },
            tooltip: {
                valueSuffix: '\xB0C' //the suffix when you hover over the graph for temperature
            },
            xAxis: {
                categories: daysArray,
                crosshair: true
            },
            yAxis: [
            {
                //creating the 2 y-axis elements in the array
                labels: {
                    format:  '{value}°C'
                },
                opposite: true, //creating axis on the oppposite sides
                title: {
                    text: 'Forecast Temperature'
                },
                plotLines:[{
                    values: 0
                }]
            },
            {
                labels: {
                    format: '{value} kWh'
                },
                title: {
                    text: 'Power Production'
                }
            }],
            tooltip: {
                shared: true
            },
            series: [
                {
                    name: "Forecast Temperature",
                    type: 'column',
                    data: tempVals,
                    tooltip: {
                        valueSuffix: '°C'
                    }
                },
                {
                    name: 'Solar Power values',
                    type: 'spline',
                    yAxis: 1,
                    data: predictedSolarVals,
                    tooltip: {
                        valueSuffix: ' kWh'
                    }
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
    * Retrieves max temperature data from 'Weather' tab and predicts the predicted solar power generated in the next week
    * Calls renderChart() to plot the values
    * @author: Raja Vyshnavi Sriramoju
    */
    function graphData_MLModel() {

        var forecast_TempVals = sessionStorage.getItem("temperatureVals");
        forecast_TempVals = JSON.parse(forecast_TempVals);
        //console.log("Printing vals from weather tab");
        //console.log(forecast_TempVals);

        if (forecast_TempVals == null){
            document.getElementById("predictionChart").innerHTML = "Weather Values have not been obtained for prediction of solar power production. Please visit Weather tab first.";
        }

        const uri_chart1 = 
            `http://127.0.0.1:5000/analysis/MLModel/${forecast_TempVals[0]}/${forecast_TempVals[1]}/${forecast_TempVals[2]}/${forecast_TempVals[3]}/${forecast_TempVals[4]}/${forecast_TempVals[5]}/${forecast_TempVals[6]}`;
        var res_chart1 = JSON.parse(Get(uri_chart1));

        var d = new Date();
        var today = d.getDay();
        var days = [];

        //This creates the array of days for the x-axis values
        for(let j = 0; j < 7; j++)
        {
            switch(today){
                case 0: days[j] = "Mon";
                    break;
                case 1: days[j] = "Tues";
                    break;
                case 2: days[j] = "Wed";
                    break;
                case 3: days[j] = "Thu";
                    break;
                case 4: days[j] = "Fri";
                    break;
                case 5: days[j] = "Sat";
                    break;
                case 6: days[j] = "Sun";
                    break;          
            }
            if( today == 6)
                today = 0;
            else
                today = today+1;
        }
        
        var predictedSolarVals = [];
        var labels = [];
        
        for (let i = 0; i < 7; i++) {

            let singleElement = res_chart1[i];

            for (let prop in singleElement) {
                if (prop == 'Column1')
                predictedSolarVals.push(singleElement[prop]); //will be y-values
            }
        }
        renderChart(predictedSolarVals, forecast_TempVals, days); //x-values
        
    }
    //making the function call so that call is made as soon as html page loads
    graphData_MLModel();
});