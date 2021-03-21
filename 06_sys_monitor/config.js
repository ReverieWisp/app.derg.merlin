var config = {};
// =================================

// The key used to store your machine in the DB
config.machineKey = "merlin";

// Number of samples to accumulate for the current machine
config.trackedLength = 50;

// Milliseconds between reports
config.refreshRate = 5000;

// Endpoint target
config.endpoint = "rw0.pw/api/v1/report";

// =================================
module.exports = config;
