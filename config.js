module.exports = {
	secret: '<put a good secret to secure your sessions here>',
	password: '<this is the password to log in>',
	documentFolderName: '<relative folder name to archive into>',
	queueFolderName: '<relative folder name to read from>',
	directoryBlacklist: ['@eaDir'],
	gpgPublicKeyId: '<id of your gpg public key to encrpyt with>',
	port: 7554
};