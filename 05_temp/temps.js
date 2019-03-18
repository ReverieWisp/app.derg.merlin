const si = require('systeminformation');
// promises style - new since version 3

function getCPULoad(call) {
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

function getMEMLoad(call) {
	si.mem().then(data => {
		let obj = {};
		let decimals = 0;

		obj.total = (data.total / 1024 / 1024).toFixed(decimals);
		obj.used = (data.active / 1024 / 1024).toFixed(decimals);
		obj.cache = (data.buffcache / 1024 / 1024).toFixed(decimals);

		call(obj);
	})
}

setInterval(function(){
	getMEMLoad(res => {
		console.log("total " + res.total);
		console.log("used " + res.used);
		console.log("cached " + res.cache);
	});
	/*
	getCPULoad(res => {
		console.log("usr: " + res.user.toFixed(2));
		console.log("sys: " + res.system.toFixed(2));
	});
	*/
}, 5000);

console.log('testing stuff');
