const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const { exec } = require('child_process');

const destinationRootDirectory = path.join(__dirname, '..', config.documentFolderName);
const queueDirectory = path.join(__dirname, config.queueFolderName);
const directoryBlacklist = config.directoryBlacklist;

// getQueueFileCollection
let getQueueFileCollection = (req, res) => {
	filewalker(queueDirectory, queueDirectory, 1, null, true, false, function (err, files) {
		if (err) throw err;
		
		res.json(files);
	});
};

// getArchiveFileCollection
let getArchiveFileCollection = (req, res) => {
	var relativeDestinationDirectory = req.params.directoryName;
	if (!relativeDestinationDirectory) throw new Error('missing mandatory parameter');
	if (relativeDestinationDirectory.includes('..')) throw new Error('invalid parameter');
	
	var destinationDirectory = path.join(destinationRootDirectory, relativeDestinationDirectory);

	filewalker(destinationDirectory, destinationDirectory, 1, null, true, false, function (err, files) {
		if (err) throw err;
		
		res.json(files);
	});
};

// putQueueFile
let putQueueFile = (req, res) => {
	var fileName = req.params.fileName;
	var newfileName = req.query.newFileName;
	var relativeDestinationDirectory = req.query.destination;
	if (!fileName || !relativeDestinationDirectory || !newfileName) throw new Error('missing mandatory parameter');
	if (fileName.includes('..') || relativeDestinationDirectory.includes('..') || newfileName.includes('..') || newfileName.includes('/')) throw new Error('invalid parameter');
	
	var queueFileNameUnencrypted = path.join(queueDirectory, fileName);
	var queueFileNameEncrypted = queueFileNameUnencrypted + '.gpg';
	var destinationDirectory = path.join(destinationRootDirectory, relativeDestinationDirectory);
	var destinationFileName = path.join(destinationDirectory, newfileName + '.gpg');

	console.log('trying to move ' + fileName + ' to ' + relativeDestinationDirectory);
	console.log('* q unencrypted ' + queueFileNameUnencrypted);
	console.log('* q encrypted ' + queueFileNameEncrypted);
	console.log('* destination dir ' + destinationDirectory);
	console.log('* destination file ' + destinationFileName);

	// destination is a directory
	fs.stat(destinationDirectory, function(err, stat){
		if (stat && stat.isDirectory()) {

			// destination file is inaccessible? i.e. does not exist already?
			fs.access(destinationFileName, function(err) {
				if (err) {
					console.log('destinationFileName does not exist yet');
					
					var escapedFileName = escapeShellArg(path.join(queueDirectory, fileName));					
					const gpg = exec('sudo -u ' + config.synologyAdminUserName + ' -E gpg -r ' + config.gpgPublicKeyId + ' --always-trust --encrypt ' + escapedFileName + '', function(err) {
						if (err) {
							res.status(500).send('error executing gpg ' + err);
						} else {
							console.log('gpg executed');

							// move encrypted file
							fs.rename(queueFileNameEncrypted, destinationFileName, function (err) {
								if (err) {
									res.status(500).send('error on moving file');
									
									fs.unlink(queueFileNameEncrypted, function (err) {
										if (err) {
											res.status(500).send('error deleting encrypted file ' + err);
										}
									});
								} else {
									console.log('moved file to target');
									
									// delete source file
									fs.unlink(queueFileNameUnencrypted, function (err) {
										if (err) {
											res.status(500).send('error deleting source file ' + err);
										} else {
											console.log('queue file deleted');

											res.status(204).send();
										}
									});
									
								}
							});

						}
					});
					
				} else {
					console.log('target exists already');
					res.status(400).send('file exists already at destination');
				}
			});
		} else {
			res.status(400).send('destination is no valid directory');
		}
	});
};

// getArchiveDirectoryCollection
let getArchiveDirectoryCollection = (req, res) => {
	var parentDirectory = req.params.directoryName;
	var directoryNamePattern = req.query.pattern;
	var depth = req.query.depth;
	if (parentDirectory.includes('..') || (directoryNamePattern && directoryNamePattern.includes('..')) || (directoryNamePattern && directoryNamePattern.includes('/')) || !Number.isInteger(parseInt(depth)) || (depth < 0) || (depth > 25)) throw new Error('invalid parameter');
	
	filewalker(path.join(destinationRootDirectory, parentDirectory), destinationRootDirectory, depth, directoryNamePattern, false, true, function (err, dirs) {
		if (err) throw err;
		
		res.json(dirs);
	});
};

/**
 * Explores recursively a directory up tp a defined depth and returns all the folderpaths in the callback.
 * 
 * @see http://stackoverflow.com/a/5827895/4241030
 */
function filewalker(dir, baseDir, levelToGo, directoryNamePattern, returnFiles, returnDirectories, done) {
    let results = [];

	fs.readdir(dir, function(err, list) {
		if (err) return done(err);

		var pending = list.length;

		if ((!pending) || (levelToGo == 0)) return done(null, results);
				
		list.forEach(function(file){
			let fullFile = path.resolve(dir, file);

			fs.stat(fullFile, function(err, stat){
				if (stat && ((returnDirectories && stat.isDirectory()) || (returnFiles && !stat.isDirectory()))) {
					//console.log(directoryNamePattern.toLowerCase());
					if ((!directoryNamePattern || (directoryNamePattern && file.toLowerCase().includes(directoryNamePattern.toLowerCase()))) && (true)) {
						results.push(path.relative(baseDir, fullFile));
					}

					if (stat.isDirectory()) {
						filewalker(fullFile, baseDir, levelToGo - 1, directoryNamePattern, returnFiles, returnDirectories, function(err, res){
							results = results.concat(res);
							if (!--pending) done(null, results);
						});
					} else {
						if (!--pending) done(null, results);
					}
				} else {
					if (!--pending) done(null, results);
				}
			});
		});
	});
};


exports.getQueueFileCollection = getQueueFileCollection;
exports.getArchiveDirectoryCollection = getArchiveDirectoryCollection;
exports.getArchiveFileCollection = getArchiveFileCollection;
exports.putQueueFile = putQueueFile;

function escapeShellArg (arg) {
	return `'${arg.replace(/'/g, `'\\''`)}'`;
}
