/*chart-highchart.js*/
$(document).ready(function () {

    function consumption(value) {
        return (value);
    }

    function renderChart(feature1, feature2, feature1Vals, feature2Vals, dates) {
        //var ctx = document.getElementById("myChart").getContext('2d');
        var highChart = new Highcharts.chart('myChart', {
            chart: {
                //renderTo: "myChart",
                type: 'line',
                zoomType: "x"
            },
            title: {
                text: 'Power Consumption'
            },
            tooltip: {
                valueSuffix: '\xB0C'
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
                }]
            },
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

    function Get(yourUrl) {
        var Httpreq = new XMLHttpRequest(); // a new request
        Httpreq.open("GET", yourUrl, false);
        Httpreq.send(null);
        return Httpreq.responseText;
    }

    // $("#renderBtn-highchart").click(
    //     function () {
    //         var startDate = document.getElementById("Date1").value;
    //         var endDate = document.getElementById("Date2").value;

    //             var filename = document.getElementById("filename").value;
    //             var feature1 = document.getElementById("feature1").value;
    //             var feature2 = document.getElementById("feature2").value;

    //         console.log(startDate);
    //         console.log(endDate);
    //         console.log(filename);
    //         console.log(feature1);
    //         console.log(feature2);

    //             const uri = `http://localhost:5000/${filename}/${startDate}/${endDate}/${feature1}/${feature2}`;        
    //         var res = JSON.parse(Get(uri)); //"http://localhost:5000/cieeData/2018-01-04/2018-01-05"));
    //         console.log(res);
            
    //         var feature1Vals = [];
    //         var feature2Vals = []
    //         var labels = [];
            
            
    //         for(let i = 0; i < 500; i++){

    //             let singleElement = res[i];

    //             for(let prop in singleElement){
    //                 if(prop == feature1)
    //                     feature1Vals.push(singleElement[prop]);
    //                 if(prop == feature2)
    //                     feature2Vals.push(singleElement[prop]);           
    //             }
    //             labels.push(res[i].Time);

    //         }        
            
    //         console.log(labels);
    //         console.log(feature1Vals);
    //         console.log(feature2Vals)
    //         renderChart(feature1, feature2, feature1Vals, feature2Vals, labels);
            
    //     }
    // );

    function render() {
        var startDate = document.getElementById("Date1").value;
        var endDate = document.getElementById("Date2").value;

        var filename = document.getElementById("filename").value;
        var feature1 = document.getElementById("feature1").value;
        var feature2 = document.getElementById("feature2").value;

        var startDate = '2018-06-01';
        var endDate = '2018-06-02';

        var filename = 'Control2';
        var feature1 = 'FreComp';
        var feature2 = 'HVAC1';

        console.log(startDate);
        console.log(endDate);
        console.log(filename);
        console.log(feature1);
        console.log(feature2);

        const uri = `http://127.0.0.1:5000/${filename}/${startDate}/${endDate}/${feature1}/${feature2}`;     
        //const uri = `http://127.0.0.1:5000/Control2/2018-06-01/2018-06-02/FreComp/HVAC1`;
        var res = JSON.parse(Get(uri)); //"http://localhost:5000/cieeData/2018-01-04/2018-01-05"));
        console.log(res);

        var feature1Vals = [];
        var feature2Vals = []
        var labels = [];


        for (let i = 0; i < 500; i++) {

            let singleElement = res[i];

            for (let prop in singleElement) {
                if (prop == feature1)
                    feature1Vals.push(singleElement[prop]);
                if (prop == feature2)
                    feature2Vals.push(singleElement[prop]);
            }
            labels.push(res[i].Time);

        }

        console.log(labels);
        console.log(feature1Vals);
        console.log(feature2Vals)
        renderChart(feature1, feature2, feature1Vals, feature2Vals, labels);

    };
    render();
});