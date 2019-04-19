// Requirements
const express = require('express');
const app = express();
const util = require('util');
const request = require('request');
const helmet = require('helmet')

// markov
const Markov = require('markov-strings').default;



  ///////////////////////////////////
 // Endpoint and port information //
///////////////////////////////////

// General config
const api_port = 8080;                      // TODO: External config
const api_separator = "/";                  // TODO: External config
const api_forward = api_separator + "api/"; // TODO: External config
const api_root = api_forward + "v1/";       // TODO: External config



  //////////////////////////////////
 // Usage, setup, and processing //
//////////////////////////////////

// Set appropriate headers - no sniff, and adjust to allow cross origin request.
// https://helmetjs.github.io/docs/dont-sniff-mimetype/
app.use(helmet.noSniff());
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});



  //////////////////////
 // Helper functions //
//////////////////////

// GlobalLog object for consistent logging
GlobalLog = {};
GlobalLog.log = (toLog) => { console.log(`[Log] ${toLog}`); }
GlobalLog.warn = (toLog) => { console.log(`[Warning] ${toLog}`) }
GlobalLog.error = (toLog) => { console.log(`[ERROR] ${toLog}`) }
GlobalLog.fatal = (toThrow) => { throw `[ERROR] ${toThrow}`; }


// Format a successful generic response
function formatSuccess(optionalNote) {
	obj = {};
	obj.server = serverName;
	obj.status = `success`;

	if(optionalNote)
		obj.note = optionalNote;

	return obj;
}


// Format a failed generic response
function formatError(description, optionalNote) {
	let obj = {};
	obj.server = `serverName`;
	obj.status = `error`;
	obj.description = description;

	// If an example of the API for this is not sent correctly, sent back an example.
	if(optionalNote != null)
		obj.note = formatExample;

	return obj;
}


// If the key is pressent in the query string, parse it into the target.
function optionalAssignItem(req, target, key) {
	if(req.query[key] != null)
		target[key] = req.query[key];
}


// Requires the key to exist, then parses it from the query and assigns to the target.
// Throws an exception if the key is not present.
function verifyAssignItem(req, res, target, key) {
	if(req.query[key] == null) {
		let formatted = `Key not found - Expected to find '${key}'`;

		res.send(formatError(formatted));
		GlobalLog.fatal(formatted);
	} else {
		optionalAssignItem(req, target, key);
	}
}


// Store a specific value in an array with a max length
function storeValue(target_array, toStore, length) {
	target_array.unshift(toStore);

	if(target_array.length > length)
		target_array.pop();
}


// Copy the most recent value of the key in from the list of saved versions.
// If it isn't present, continue, but note it in a warning that it was expected.
function copyKeyLatest(target, source, key, processCallback) {
	if(source[0].key != null) {
		if(processCallback != null)
			target[key] = processCallback(source[0][key]);
		else
			target[key] = source[0][key];
	} else {
		GlobalLog.Warning(`Couldn't find expected key '${key}' when forming response`);
	}
}


// Copy all values into an array on the target under the name of the key.
// If it isn't present, continue, but note it in a warning that it was expected.
function copyKeyAccumulate(target, source, key, processCallback) {
	if(source[0].key != null) {
		target[key] = [];

		for(let i = 0; i < source.length; ++i) {
			if(processCallback != null)
				target[key].push(processCallback(source[i][key]));
			else
				target[key] = source[i][key];
		}
	} else {
		GlobalLog.Warning(`Couldn't find expected key '${key}' when forming response`);
	}
}



  ///////////////////////////
 // General API Endpoints //
///////////////////////////

// Site home: /
app.all(api_separator, (req, res) => {
	res.send('<!DOCTYPE html><html><head><title>Dragon App</title></head><style>body{font-family: monospace;}</style><body>Welcome to derg.app, an API and service domain managed by <a href="https://www.reveriewisp.com/">Wisp</a>!</body><html>');
});

// API forward: /api/
app.all(api_forward, (req, res) => {
	res.send(formatSuccess('Version needs to be specified in path, formatted as `vN/`. The most recent version is `v1`.'));
});

// API root: /api/vN/
app.all(api_root, (req, res) => {
	res.send(formatSuccess('Yep, this is the API root for v1!'));
});



  ///////////////
 // Stats API //
///////////////

// Variables
const api_stats = api_root + "stats/";

let savedStatsItems = {};
let serverName = "merlin"; // TODO: External config 

// .../
// The root of stats. Doesn't do anything but provide help text.
app.all(api_stats, (req, res) => {
	res.send(formatSuccess(`Append '/get/:machine_name' for a target, or '/all' for a list of machines`));
});


// .../report/
// This api endpoint allows a specific key to report its max ram and associated load information.
// The information is stored however it is entered for retrieval later. 
// It outputs the formatted stats item so you can verify what was logged.
app.all(api_stats + "report/", (req, res) => {
	if(Object.keys(req.query).length >= 1) {
		// Verify and parse keys
		let statsItem = {};
		verifyAssignItem(req, res, statsItem, "key");
		verifyAssignItem(req, res, statsItem, "trackedLength");
		verifyAssignItem(req, res, statsItem, "refreshRate");
		verifyAssignItem(req, res, statsItem, "ramMax");
		verifyAssignItem(req, res, statsItem, "ramLoadUsed");
		verifyAssignItem(req, res, statsItem, "ramLoadCached");
		verifyAssignItem(req, res, statsItem, "cpuLoadUser");
		verifyAssignItem(req, res, statsItem, "cpuLoadSystem");
		optionalAssignItem(req, statsItem, "hide");
		optionalAssignItem(req, statsItem, "other");

		GlobalLog.log(`Recieved report from '${statsItem.key}'`);
		
		if(!savedStatsItems.hasOwnProperty(statsItem.key))
			savedStatsItems[statsItem.key] = [];

		storeValue(savedStatsItems[statsItem.key], statsItem, statsItem.trackedLength);
		res.send(formatSuccess());
	} else {
		res.send(formatError("Could not parse or identify query string"));
	}
});


// .../reset/
// Resets the internal arrays so that stats can be read from the beginning again
app.all(api_stats + "reset/", (req, res) => {
	savedStatsItems = {};
	res.send(formatSuccess());
});


// .../get/:id
// Allows the retrieval of temporarily stored information
app.all(api_stats + "get/:id", (req, res) => {
	let id = req.param("id");
	let error = formatError("Invalid stats 'get' request");

	if(id == null) {
		res.send(error);
		return;
	}

	if(savedStatsItems.hasOwnProperty(id)) {
		let obj = {};
		let source = savedStatsItems[id];

		copyKeyLatest(obj, source, "key");
		copyKeyLatest(obj, source, "trackedLength", Number.parseFloat);
		copyKeyLatest(obj, source, "refreshRate", Number.parseFloat);
		copyKeyLatest(obj, source, "ramMax", Number.parseFloat);
		copyKeyAccumulate(obj, source, "ramLoadUsed", Number.parseFloat);
		copyKeyAccumulate(obj, source, "ramLoadCached", Number.parseFloat);
		copyKeyAccumulate(obj, source, "cpuLoadUser", Number.parseFloat);
		copyKeyAccumulate(obj, source, "cpuLoadSystem", Number.parseFloat);

		res.send(obj);
	} else {
		res.send(error);
	}
});


// Allows you to poll all possible logged systems to request
app.all(api_stats + "all/", (req, res) => {
	let allKeys = Object.keys(savedStatsItems);
	let toReturn = {};

	toReturn.keys = [];
	// Clone/copy over
	for(let i = 0; i < allKeys.length; ++i) {
		if(savedStatsItems[allKeys[i]].hide == null || savedStatsItems[allKeys[i]].hide == false)
			toReturn.keys.push(allKeys[i]);
	}

	// Alphabatize
	toReturn.keys.sort();

	// Respond
	res.send(toReturn);
});



  //////////////////////
 // Markov chain API //
//////////////////////
// From: https://www.npmjs.com/package/markov-strings

// Config
const api_markov = api_root + "markov/";
const data = require('./sentences.js');

// Build the Markov generator
const markov = new Markov(data, { stateSize: 2 });
markov.buildCorpus();


// .../get/
// Response with no specified input for markov chain creation with defaults
app.all(api_markov + "get", (req, res) => {
	runMarkov(req, res)
});


// .../get/:input
// Get a generated response based on the input provided
app.all(api_markov + "get/:input", (req, res) => {
	let input = req.param("input");
	let error = formatError("Invalid markov 'get' request");

	if(input == null) {
		res.send(error);
		return;
	}

	runMarkov(req, res);
});


// Generates the markov chain with specified options
function runMarkov(req, res) {
	const options = {
	  maxTries: 200, 
	  filter: (result) => {
	    return result.score > 0 &&
	    result.refs.length > 2;
	  }
	}

	const result = markov.generate(options)

	res.send(result);
}



  ////////////////////
 // Tell it to run //
////////////////////

// Bind to port and begin listening
app.listen(api_port, () => {
	GlobalLog.log(`API active, listening on port ${api_port}`)
});
