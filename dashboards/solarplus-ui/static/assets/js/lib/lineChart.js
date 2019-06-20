/*lineChart.js*/
$(document).ready(function() {

    function consumption(value){
        return (value);
    }

    function renderChart(feature1, feature2, feature1Vals, feature2Vals, labels) {
        var ctx = document.getElementById("myChart").getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets:[{
                        label: feature1+" Values",
                        data: feature1Vals,
                        borderColor:"red",
                        backgroundColor:"transparent",
                        fill: false,
    		          },
    		      {
                        label:feature2+" Values",
                        data: feature2Vals,
                        borderColor:"rgba(75, 192, 192, 1)",
                        backgroundColor:"transparent",
                        fill: false,
    		      }]
            },
            options: {            
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            callback: function(value, index, values) {
                                return consumption(value);
                            }
                        }
                    }]                
                }
            },
        });
    }

    function Get(yourUrl){
        var Httpreq = new XMLHttpRequest(); // a new request
        Httpreq.open("GET",yourUrl,false);
        Httpreq.send(null);
        return Httpreq.responseText;          
    }

    $("#renderBtn").click(
        function () {
            var startDate = document.getElementById("Date1").value;
            var endDate = document.getElementById("Date2").value;

                var filename = document.getElementById("filename").value;
                var feature1 = document.getElementById("feature1").value;
                var feature2 = document.getElementById("feature2").value;

                const uri = `http://localhost:5000/${filename}/${startDate}/${endDate}/${feature1}/${feature2}`;        
            var res = JSON.parse(Get(uri)); //"http://localhost:5000/cieeData/2018-01-04/2018-01-05"));
            console.log(res);
            
            var feature1Vals = [];
            var feature2Vals = []
            var labels = [];
            
            
            for(let i = 0; i < 250; i++){

                let singleElement = res[i];

                for(let prop in singleElement){
                    if(prop == feature1)
                        feature1Vals.push(singleElement[prop]);
                    if(prop == feature2)
                        feature2Vals.push(singleElement[prop]);           
                }
                labels.push(res[i].Time);

            }        
            
            console.log(labels);
            console.log(feature1Vals);
            console.log(feature2Vals)
            renderChart(feature1, feature2, feature1Vals, feature2Vals, labels);
            
        }
    );

    $("#linechartCSV").click(
        function () {
            var startDate = document.getElementById("Date1").value;
            var endDate = document.getElementById("Date2").value;
    
            const uri = `http://localhost:5000/cieeData/${startDate}/${endDate}`;
            
            var res = JSON.parse(Get(uri)); //"http://localhost:5000/cieeData/2018-01-04/2018-01-05"));
            //console.log(res);
            
            var result, ctr, keys, columnDelimiter, lineDelimiter, data, csv, eCSV;
            data = res;
            columnDelimiter =  ',';
            lineDelimiter =  '\n';
    
            keys = Object.keys(data[0]);
    
            result = '';
            result += keys.join(columnDelimiter);
            result += lineDelimiter;
    
            data.forEach(function(item) {
                ctr = 0;
                keys.forEach(function(key) {
                    if (ctr > 0) result += columnDelimiter;
    
                    result += item[key];
                    ctr++;
                });
                result += lineDelimiter;
            });
            //console.log(result);
            csv = 'data:text/csv;charset=utf-8,' + result;
            eCSV = encodeURI(csv);
    
            //console.log(eCSV);
    
            var hiddenElement = document.createElement('a');
            hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(result);
            hiddenElement.target = '_blank';
            hiddenElement.download = 'linechart.csv';
            hiddenElement.click();
            console.log("print")
    
        }
    );

});