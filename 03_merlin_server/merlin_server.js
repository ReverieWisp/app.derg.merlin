// Requirements
const os = require('os');
const express = require('express');
const app = express();
const util = require('util');
const request = require('request');
const helmet = require('helmet')

// Settings
const api_port = 8080;
const api_root = "/api/v1/";
const api_stats = api_root + "stats/";

// Local variables 
let savedStatsItems = {};


// --------------------------------------------------


// Set appropriate headers - no sniff, and adjust headers.
// https://helmetjs.github.io/docs/dont-sniff-mimetype/
app.use(helmet.noSniff())
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});


// Root
app.get(api_root, (req, res) => {
	res.send('Yep, this is the API root for v1!');
});


// Stats
app.get(api_stats, (req, res) => {
	res.send('Stats Root, append \'/name\' for target machine');
});


// Error format support
function formatErr(toFormat, formatExample) {
	let obj = {};
	obj.error = toFormat;

	// If an example of the API for this is not sent correctly, sent back an example.
	if(formatExample != null)
		obj.apiExample = formatExample;

	return obj;
}


// This api endpoint allows a specific key to report its max ram and associated load information.
// The information is stored however it is entered for retrieval later. 
// It outputs the formatted stats item so you can verify what was logged.
// Fields: 
//   key - string that is an identifier for the system
//   ramMax - max amount of ram, in MB
//   ramInterval - polling rate of ram, in ms
//   cpuInterval - polling rate of cpu, in ms
//   ramLoad[] - array of sets of used ram values, arbitrary length.
//   cpuLoad[] - array of sets of used cpu values, arbitrary length.
//   other[] (optional) - additional info, string array, anything, arbitrary length.
//   hide - if this is "true", true, otherwise false. This determins if it shows up in the general list.
let example_report = "/api/v1/stats/report?key=test&ramMax=8192&ramInterval=5000&ramLoad[]=2141&cpuInterval=5000&cpuLoadUser[]=34&cpuLoadUser[]=7.24&cpuLoadSystem[]=3.4&cpuLoadSystem[]=7.7&other[]=stuff";
app.all(api_stats + "report/", (req, res) => {
	let statsItem = {};
	let count = 0;

	if(Object.keys(req.query).length >= 1)
	{
		if(req.query.key == null 
			|| req.query.ramInterval == null 
			|| req.query.ramMax == null 
			|| req.query.cpuInterval == null 
			|| req.query.cpuLoadUser == null 
			|| req.query.cpuLoadUser.length == null
			|| req.query.cpuLoadSystem == null 
			|| req.query.cpuLoadSystem.length == null
			|| req.query.ramLoadUsed == null 
			|| req.query.ramLoadUsed.length == null
			|| req.query.ramLoadCache == null 
			|| req.query.ramLoadCache.length == null) {
			res.send(formatErr("formatting error", example_report));
			return;
		}

		statsItem.key = req.query.key;
		statsItem.ramMax = Number.parseFloat(req.query.ramMax);
		statsItem.ramInterval = Number.parseFloat(req.query.ramInterval);
		statsItem.cpuInterval = Number.parseFloat(req.query.cpuInterval);
		statsItem.hide = false;
		statsItem.ramLoadUsed = [];
		statsItem.ramLoadCache = [];
		statsItem.cpuLoadUser = [];
		statsItem.cpuLoadSystem = [];
		statsItem.other = [];

		let ramLenUsed = req.query.ramLoadUsed.length;
		for (let i = 0; i < ramLenUsed; i++) {
			statsItem.ramLoadUsed.push(Number.parseFloat(req.query.ramLoadUsed[i]));
		}

		let ramLenCache = req.query.ramLoadCache.length;
		for (let i = 0; i < ramLenCache; i++) {
			statsItem.ramLoadCache.push(Number.parseFloat(req.query.ramLoadCache[i]));
		}

		let cpuLenUser = req.query.cpuLoadUser.length;
		for (let i = 0; i < cpuLenUser; i++) {
			statsItem.cpuLoadUser.push(Number.parseFloat(req.query.cpuLoadUser[i]));
		}

		let cpuLenSys = req.query.cpuLoadSystem.length;
		for (let i = 0; i < cpuLenSys; i++) {
			statsItem.cpuLoadSystem.push(Number.parseFloat(req.query.cpuLoadSystem[i]));
		}

		// Parse additional stuff
		if(req.query.other != null) {
			if(req.query.other.length != null) {
				let otherLen = req.query.other.length;
				for (let i = 0; i < ramLen; i++) {
					statsItem.other.push(req.query.other[i]);
				}
			}
			else {
				statsItem.other.push(req.query.other);
			}
		}

		// Parse if we're hiding or not from the 'all' list
		if(req.query.hide != null) {
			if(req.query.hide == "true")
				statsItem.hide = true;
		}

		console.log("Report from '" + statsItem.key + "'");
	}

	savedStatsItems[statsItem.key] = statsItem;
	res.send(statsItem);
});


// Resets the internal arrays
app.all(api_stats + "reset/", (req, res) => {
	savedStatsItems = {};
	res.send("cleared.");
});


// Allows the retrieval of temporarily stored information
app.get(api_stats + "get/:key", (req, res) => {
	let key = req.param("key");
	let error = "Invalid stats 'get' request";

	if(key == null) {
		res.send(error);
		return;
	}

	let caseCorrected = key.toLowerCase();
	if(savedStatsItems.hasOwnProperty(caseCorrected))
		res.send(savedStatsItems[caseCorrected]);
	else
		res.send(error);
});


// Allows you to poll all possible logged systems to request
app.get(api_stats + "all/", (req, res) => {
	let allKeys = Object.keys(savedStatsItems);
	let toReturn = {};
	toReturn.keys = [];

	// Clone/copy over
	for(let i = 0; i < allKeys.length; ++i) {
		if(savedStatsItems[allKeys[i]].hide == false)
			toReturn.keys.push(allKeys[i]);
	}

	// Alphabatize
	toReturn.keys.sort();

	res.send(toReturn);
})


// Bind to port and begin listening
app.listen(api_port, () => {
	console.log(`API active, listening on port ${api_port}`)
});
