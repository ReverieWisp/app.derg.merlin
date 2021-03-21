var config = {};

// Rename this file to config.js, and update it with your settings. 
// Below are some sample defaults.
// =================================

// The key used to store your machine in the DB
config.machineKey = "Demo";

// Number of samples to accumulate for the current machine
config.trackedLength = 50;

// Milliseconds between reports
config.refreshRate = 5000;

// Endpoint target
config.endpoint = "example.com/location/of/merlin/server";

// =================================
module.exports = config;
