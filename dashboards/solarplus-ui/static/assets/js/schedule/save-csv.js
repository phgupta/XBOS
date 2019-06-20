// function myFunction() {
//     alert("I am an alert box!");
// }

// // saveModes = () => {
// //     let endpoint = '/setpoints',
// //         data = this.state.modes;
// //     postToFlask(endpoint, data)
// //         .then(status => console.log(status))
// //         .catch(error => console.log(error));
// // }

// var data = [
//     ['55', '85'],
//     ['70', '75'],
//     ['55', '85'],
//     ['85', '55'],
//     ['85', '55']
// ];


// function download_csv() {
//     console.log(data);
//     var csv = 'lowSetpoint,highSetpoint\n';
//     data.forEach(function (row) {
//         csv += row.join(',');
//         csv += "\n";
//     });

//     console.log(eCSV);
//     var hiddenElement = document.createElement('a');
//     hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
//     hiddenElement.target = '_blank';
//     hiddenElement.download = 'setpoint.csv';
//     hiddenElement.click();
// }