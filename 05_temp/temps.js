const si = require('systeminformation');
// promises style - new since version 3


setInterval(function(){
si.cpuTemperature()
    .then(data => console.log(data))
    .catch(error => console.error(error));
}, 5000);

console.log('Server running at http://localhost:8080/');
