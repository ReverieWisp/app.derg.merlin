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
let example_report = "/api/v1/stats/report?key=test&ramMax=8192&ramInterval=5000&ramLoad[]=2141&cpuInterval=5000&cpuLoad[]=34&cpuLoad[]=7&other[]=stuff";
app.all(api_stats + "report/", (req, res) => {
	let statsItem = {};
	let count = 0;

	if(Object.keys(req.query).length >= 1)
	{
		if(req.query.key == null 
			|| req.query.ramInterval == null 
			|| req.query.ramMax == null 
			|| req.query.cpuInterval == null 
			|| req.query.ramLoad == null 
			|| req.query.ramLoad.length == null 
			|| req.query.cpuLoad == null 
			|| req.query.cpuLoad.length == null) {
			res.send(formatErr("formatting error", example_report));
			return;
		}

		statsItem.key = req.query.key;
		statsItem.ramMax = req.query.ramMax;
		statsItem.ramInterval = req.query.ramInterval;
		statsItem.cpuInterval = req.query.cpuInterval;
		statsItem.ramLoad = [];
		statsItem.cpuLoad = [];
		statsItem.other = [];

		let ramLen = req.query.ramLoad.length;
		for (let i = 0; i < ramLen; i++) {
			statsItem.ramLoad.push(req.query.ramLoad[i]);
		}

		let cpuLen = req.query.cpuLoad.length;
		for (let i = 0; i < cpuLen; i++) {
			statsItem.cpuLoad.push(req.query.cpuLoad[i]);
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
	}

	savedStatsItems[statsItem.key] = statsItem;
	res.send(statsItem);
});


// Allows the retrieval of temporarily stored information
app.get(api_stats + "get/:key", (req, res) => {
	let key = req.param("key");
	let error = "Invalid stats 'get' request";

	if(key == null)
	{
		res.send(error);
		return;
	}

	let caseCorrected = key.toLowerCase();
	if(savedStatsItems.hasOwnProperty(caseCorrected))
		res.send(savedStatsItems[caseCorrected]);
	else
		res.send(error);
});


// Bind to port and begin listening
app.listen(api_port, () => {
	console.log(`API active, listening on port ${api_port}`)
});
