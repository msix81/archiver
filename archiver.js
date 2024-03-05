const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const { exec } = require('child_process');

const destinationRootDirectory = config.documentFolderName;
const queueDirectory = config.queueFolderName;
const directoryBlacklist = config.directoryBlacklist;

let directoryCache = null;

// getQueueFileCollection
let getQueueFileCollectionService = (req, res) => {
	filewalker(queueDirectory, queueDirectory, 1, null, true, false, function (err, files) {
		if (err) throw err;
		
		res.json(files);
	});
};

// getArchiveFileCollection
let getArchiveFileCollectionService = (req, res) => {
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
let putQueueFileService = (req, res) => {
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
					const gpg = exec('gpg -r ' + config.gpgPublicKeyId + ' --always-trust --encrypt ' + escapedFileName + '', function(err) {
						if (err) {
							res.status(500).send('error executing gpg ' + err);
						} else {
							console.log('gpg executed');

							// move encrypted file
							move(queueFileNameEncrypted, destinationFileName, function (err) {
								if (err) {
									console.log(err);
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
let getArchiveDirectoryCollectionService = (req, res) => {
	var parentDirectory = req.params.directoryName;
	var directoryNamePattern = req.query.pattern ? req.query.pattern.toLowerCase() : "";
	var depth = req.query.depth;
	if (parentDirectory.includes('..') || (directoryNamePattern && directoryNamePattern.includes('..')) || (directoryNamePattern && directoryNamePattern.includes('/')) || !Number.isInteger(parseInt(depth)) || (depth < 0) || (depth > 25)) throw new Error('invalid parameter');
	
	if (directoryCache == null) {
		updateArchiveDirectoryCache(function() {
			res.json(getArchiveDirectoryCollection(parentDirectory, directoryNamePattern, depth));
		}, 25);
	} else {
		res.json(getArchiveDirectoryCollection(parentDirectory, directoryNamePattern, depth));
	}
	
		
};

function getArchiveDirectoryCollection(parentDirectory, directoryNamePattern, depth) {
	parentDirectory = ("/" === parentDirectory) ? "" : parentDirectory;
	return responseBódy = directoryCache.filter(cachedEntry => { 
		return cachedEntry.startsWith(parentDirectory) && // ensure correct parent directory
			((cachedEntry.substr(parentDirectory.length + 1).split(path.sep).length - 1) < parseInt(depth)) && // part after parent directory considers depth
			cachedEntry.substr(cachedEntry.lastIndexOf(path.sep) + 1).toLowerCase().includes(directoryNamePattern) && // consider search pattern in leaf
			cachedEntry != parentDirectory // do not return parent directory itself
			;
	});
}


let updateArchiveDirectoryCacheService = (req, res) => {
	var depth = req.query.depth;
	if (!Number.isInteger(parseInt(depth)) || (depth < 0) || (depth > 25)) throw new Error('invalid parameter');
	
	updateArchiveDirectoryCache(function() {res.json("ok");}, depth);	
};

function updateArchiveDirectoryCache(onComplete, depth) {
	filewalker(destinationRootDirectory, destinationRootDirectory, depth, null, false, true, function (err, dirs) {
		if (err) throw err;
		
		directoryCache = dirs;
		
		onComplete();
	});
}

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

/**
 * Replacement for fs.rename because it does not support renaming across different devices - which we may need.
 * 
 * @see https://stackoverflow.com/a/29105404
 */
function move(oldPath, newPath, callback) {

    fs.rename(oldPath, newPath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy();
            } else {
                callback(err);
            }
            return;
        }
        callback();
    });

    function copy() {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('error', callback);
        writeStream.on('error', callback);

        readStream.on('close', function () {
            fs.unlink(oldPath, callback);
        });

        readStream.pipe(writeStream);
    }
}

let getConfigParameterService = (req, res) => {
	var parameterName = req.params.parameterName;
	var isDownload = req.query.download != null;
	if (parameterName !== 'suggestions') throw new Error('invalid parameter name');
	
	if (isDownload) {
		res.set('Content-Disposition', 'attachment; filename=archiver-parameter-' + parameterName + '-' + new Date().toISOString().split('T')[0] + '.txt');
	}
	
	// we treat every parameter as string, therefore no conversion whatsoever
	res.status(200).send(config[parameterName]);	
};

let putConfigParameterService = (req, res) => {
	var parameterName = req.params.parameterName;
	var incomingData = '';
	if (parameterName !== 'suggestions') throw new Error('invalid parameter name');

	req.setEncoding('utf8');
	req.on('data', function(chunk) { incomingData += chunk; });
	
	// after data transmission has finished
	req.on('end', function() { 
		var parameterValue = incomingData;
		
		// we treat every parameter as string, therefore no conversion whatsoever
		config[parameterName] = parameterValue;
		
		res.status(200).send('config "' + parameterName + '" updated with ' + parameterValue);
	});
};



exports.getQueueFileCollectionService = getQueueFileCollectionService;
exports.getArchiveDirectoryCollectionService = getArchiveDirectoryCollectionService;
exports.getArchiveFileCollectionService = getArchiveFileCollectionService;
exports.getConfigParameterService = getConfigParameterService;
exports.updateArchiveDirectoryCacheService = updateArchiveDirectoryCacheService;
exports.putConfigParameterService = putConfigParameterService;
exports.putQueueFileService = putQueueFileService;

function escapeShellArg (arg) {
	return `"${arg.replace(/'/g, `'\\''`)}"`;
}
