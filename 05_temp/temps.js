const si = require('systeminformation');
// promises style - new since version 3


setInterval(function(){
	si.currentLoad().then(data => {
		console.log("usr " + data.currentload_user);
		console.log("sys " + data.currentload_system);
	});
/*
si.cpuTemperature()
    .then(data => console.log(data))
    .catch(error => console.error(error));
*/
}, 5000);

console.log('testing stuff');
