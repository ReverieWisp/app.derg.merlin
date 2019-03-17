// Requirements
const os = require('os');           // Operating system inforamtion
const express = require('express'); // Endpoint creation
const app = express();              // Endpoint initialization
const util = require('util');       // Pretty printing
const request = require('request'); // Used for issuing GET request
const config = require('./config'); // Custom-defined config file

// Const settings - see config variable for external.
const api_root = "/api/v1/";
const api_stats = api_root + "stats/";

// Local variables
let cpuHistory = [];         // Stores previously measured values
let ramHistory = [];         // Stores previously measured values



// Store a specific
function storeValue(target_array, toStore) {
	target_array.unshift(toStore);

	if(target_array.length > config.maxTrackedLength)
		target_array.pop();
}


// machine_name is the name that is tracked for stats purposes, and is 
function generateStats(machine_name, interval, other) {
	let output = {};
	let averages = os.loadavg();
	let cpus = os.cpus().length;

	// Keep tabs on machine name
	output.key = ("" + machine_name).toLowerCase();

	// Write interval info
	output.ramInterval = interval;
	output.cpuInterval = interval;

	// Comes in a value 0 to 1 * number of CPUs
	let cpuDecimals = 2;
	output.cpuUsage = {};
	output.cpuUsage = Number((averages[0] * 100 / cpus).toFixed(cpuDecimals));
	storeValue(cpuHistory, output.cpuUsage);

	// Both come in bytes, convert to MB
	let memDecimals = 0;
	output.memTotal = Number((os.totalmem() / 1024 / 1024).toFixed(memDecimals));
	output.memFree = Number((os.freemem() / 1024 / 1024).toFixed(memDecimals));
	output.memUsed = output.memTotal - output.memFree;
	storeValue(ramHistory, output.memUsed);

	// Construct query
	let query = `https://derg.app${api_stats}report?key=${output.key}&ramMax=${output.memTotal}&ramInterval=${output.ramInterval}&cpuInterval=${output.cpuInterval}`;

	// Add on contents of ramHistory
	for (let i = 0; i < ramHistory.length; i++) {
		query += "&ramLoad[]=" + ramHistory[i];
	}

	// Add on contents of cpuHistory
	for (let i = 0; i < cpuHistory.length; i++) {
		query += "&cpuLoad[]=" + cpuHistory[i];
	}

	// Add on contents of 'other' variable, either as an array or single value.
	if(other != null) {
		if(other.length != null) {
			for (let i = 0; i < other.length; i++) {
				query += "&other[]=" + other[i];
			}
		}
		else {
			query += "&other=" + other;
		}
	}

	// Poke server to save off
	//console.log(query);
	request(query, function (error, response, body) {
		if(error != null)
			console.log("Errored when generating and logging stats:" + error);
	});
};


// Refresh automatically
setInterval(function() {
	generateStats(config.machineKey, config.refreshInterval, null) // name, refresh interval, then any extra info as an array or string.
}, config.refreshInterval);


// Denote logging
console.log(`Client issuing reports every ${config.refreshInterval}ms under key '${config.machineKey}'`);