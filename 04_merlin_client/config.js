var config = {};

config.maxTrackedLength = 50;  // number of samples to accumulate
config.refreshInterval = 5000; // milliseconds
config.machineKey = "merlin";  // the key used to store your machine in the DB

module.exports = config;
