const fs = require('fs');

module.exports = {
	secret: process.env.ARCHIVER_SECRET || (Math.random() * Date.now()).toString(), //<put a good secret to secure your sessions here - when using Archiver in Docker, this would typically come from an environment variable>
	password: process.env.ARCHIVER_PASSWORD, //<this is the password to log in - when using Archiver in Docker, this would typically come from an environment variable>
	documentFolderName: process.env.ARCHIVER_DOCFOLDER || '/archiver-out', // <absolute folder name to archive into - when using Archiver in Docker, this would typically be /archiver-out>
	queueFolderName: process.env.ARCHIVER_QFOLDER || '/archiver-in', // <absolute folder name to read from - when using Archiver in Docker, this would typically be /archiver-in>
	directoryBlacklist: ['@eaDir'],
	gpgPublicKeyId: process.env.ARCHIVER_GPGPKID, // <id of your gpg public key to encrpyt with - when using Archiver in Docker, this would typically come from an environment variable>
	port: 8080,
	suggestions: '[]',
	settingsFile: process.env.ARCHIVER_SETTINGSFILE || '', // <absolute file name to read settings from during startup>
	tryToLoadSettingsFromFile: () => {
		
		console.log('trying to load settings from file "' + module.exports.settingsFile + '"');
		// load settings if settings file has been configured
		if (module.exports.settingsFile !== '') {
			fs.readFile(module.exports.settingsFile, 'utf8', (err, data) => {
				if (err) {
					console.error(err);
					return;
				}
				module.exports['suggestions'] = data;
				console.log('Settings were loaded successfully');
			});
		}
	}

};