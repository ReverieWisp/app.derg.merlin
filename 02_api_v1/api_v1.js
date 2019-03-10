const express = require('express')
const app = express()
const port = 8080
const api_root = "/api/v1/";
const api_stats = api_root + "stats/";

app.get(api_root, (req, res) => {
	res.send('Yep, this is the API root for v1!')
});

app.get(api_stats, (req, res) => {
	res.send('Stats')
});

app.get(api_stats + "merlin", (req, res) => {
	res.send('Stats')
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))