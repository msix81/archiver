const express = require('express');
const fs = require('fs');
const config = require('./config.js');
let authenticator = require('./authenticator.js');
let archiver = require('./archiver.js');

function main () {
	let app = express();

	// routes
	app.post('/login', authenticator.login);
	app.get('/archive/:directoryName/directory', authenticator.checkToken, archiver.getArchiveDirectoryCollectionService);
	app.post('/archive/update-directory-cache', authenticator.checkToken, archiver.updateArchiveDirectoryCacheService);
	app.get('/archive/:directoryName/file', authenticator.checkToken, archiver.getArchiveFileCollectionService);
	app.put('/queue/:fileName', authenticator.checkToken, archiver.putQueueFileService);
	app.get('/queue', authenticator.checkToken, archiver.getQueueFileCollectionService);
	app.get('/config/:parameterName', authenticator.checkToken, archiver.getConfigParameterService);
	app.put('/config/:parameterName', authenticator.checkToken, archiver.putConfigParameterService);

	// embed frontend
	app.use(express.static('public'));

	// startup
	app.listen(config.port, () => console.log(`App listening at port ${config.port}`));
}

main();