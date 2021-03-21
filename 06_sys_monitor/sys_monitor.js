// Requirements
const os = require('os');                // Operating system inforamtion
const express = require('express');      // Endpoint creation
const app = express();                   // Endpoint initialization
const util = require('util');            // Pretty printing
const request = require('request');      // Used for issuing GET request
const config = require('./config');      // Custom-defined config file
const si = require('systeminformation'); // System information 

// Gets the ram used from the OS
function getRAMLoad(call) {
	si.mem().then(data => {
		let obj = {};

		obj.total = (data.total / 1024 / 1024);
		obj.used = (data.active / 1024 / 1024);
		obj.cached = (data.buffcache / 1024 / 1024);

		call(obj);
	})
}


// Gets the CPU load from the OS
function getCPULoad(call) {
	si.currentLoad().then(data => {
		let numCPUs = data.cpus.length;
		let loadUser = 0;
		let loadSystem = 0;

		for(let i = 0; i < numCPUs; ++i) {
			loadUser += data.cpus[i].loadUser;
			loadSystem += data.cpus[i].loadSystem;
		}

		loadUser /= numCPUs;
		loadSystem /= numCPUs;

		let obj = {};

		obj.user = loadUser;
		obj.system = loadSystem;

		call(obj);
	});
}


// machine_name is the name that is tracked for stats purposes, and is 
function generateStats(other) {
	let output = {};
	let averages = os.loadavg();
	let cpus = os.cpus().length;

	getCPULoad(cpuInfo => {
		getRAMLoad(memInfo => {
			// Trim values
			let ramDecimals = 0;
			let cpuDecimals = 2;

			// Keep tabs on machine name
			output.key = ("" + config.machineKey).toLowerCase();
			output.trackedLength = config.trackedLength;
			output.refreshRate = config.refreshRate;
			output.ramMax = memInfo.total.toFixed(ramDecimals);
			output.ramLoadUsed = memInfo.used.toFixed(ramDecimals);
			output.ramLoadCached = memInfo.cached.toFixed(ramDecimals);
			output.cpuLoadUser = cpuInfo.user.toFixed(cpuDecimals);
			output.cpuLoadSystem = cpuInfo.system.toFixed(cpuDecimals);

			// Construct query
			let query = `${config.endpoint}/report?`;
			let firstPass = true;

			for (var key in output) {
				if (output.hasOwnProperty(key)) {
					if(!firstPass)
						query += '&';

					query += `${key}=${output[key]}`;
					firstPass = false;
				}
			}

			// Add on contents of 'other' variable if it exists.
			if(other != null)
				query += "&other=" + other;

			// Poke server to save off
			//console.log(query);
			request(query, function (error, response, body) {
				if(error != null) {
					console.log("Errored when generating and logging stats:" + error);
				} else {
					console.log(`Sent. Received response code ${response.statusCode}`);
				}
			});
		});
	});
};


// Refresh automatically
setInterval(function() {
	generateStats(null) // name, refresh interval, then any extra info as an array or string.
}, config.refreshRate);


// Denote logging
console.log(`Client issuing reports every [${config.refreshRate}]ms under key '${config.machineKey}'`);
