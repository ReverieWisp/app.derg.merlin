const si = require('systeminformation');
// promises style - new since version 3


setInterval(function(){
	si.currentLoad().then(data => {
		let loadUser = 0;
		let loadSystem = 0;
		let numCPUs = data.cpus.length;
		for(let i = 0; i < numCPUs; ++i) {
			loadUser += data.cpus[i].load_user;
			loadSystem += data.cpus[i].load_system;
		}

		loadUser /= numCPUs;
		loadSystem /= numCPUs;

		console.log("usr: " + loadUser.toFixed(2));
		console.log("sys: " + loadSystem.toFixed(2));
	});
/*
si.cpuTemperature()
    .then(data => console.log(data))
    .catch(error => console.error(error));
*/
}, 5000);

console.log('testing stuff');
