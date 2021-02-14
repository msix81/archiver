const express = require('express');
const fs = require('fs');
const config = require('./config.js');
let authenticator = require('./authenticator.js');
let archiver = require('./archiver.js');

function main () {
	let app = express();

	// routes
	app.post('/login', authenticator.login);
	app.get('/archive/:directoryName/directory', authenticator.checkToken, archiver.getArchiveDirectoryCollection);
	app.get('/archive/:directoryName/file', authenticator.checkToken, archiver.getArchiveFileCollection);
	app.put('/queue/:fileName', authenticator.checkToken, archiver.putQueueFile);
	app.get('/queue', authenticator.checkToken, archiver.getQueueFileCollection);

	// embed frontend
	app.use(express.static('public'));

	// startup
	app.listen(config.port, () => console.log(`App listening at port ${port}`));
}

main();