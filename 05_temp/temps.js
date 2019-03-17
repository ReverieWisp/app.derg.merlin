const si = require('systeminformation');
// promises style - new since version 3

function getCPULoad(call)
{
	si.currentLoad().then(data => {
		let numCPUs = data.cpus.length;
		let loadUser = 0;
		let loadSystem = 0;

		for(let i = 0; i < numCPUs; ++i) {
			loadUser += data.cpus[i].load_user;
			loadSystem += data.cpus[i].load_system;
		}

		loadUser /= numCPUs;
		loadSystem /= numCPUs;

		let obj = {};
		obj.user = loadUser;
		obj.system = loadSystem;

		call(obj);
	});
}

setInterval(function(){
	getCPULoad(res => {
		console.log("usr: " + res.user.toFixed(2));
		console.log("sys: " + res.system.toFixed(2));
	});
}, 5000);

console.log('testing stuff');
