# Archiver
This is a web application to store documents (i.e. raw PDFs) in a secure form (i.e. GPG-encrypted) in a folder structure, e.g. on your NAS (like a Synology or QNAP device). It preferably runs inside a Docker container on a spare Raspberry, however you can also install it directly on your NAS. It is based on Node.

Standard use case:
1. you scan your documents and letters with a scanner directly onto your NAS device (e.g. via FTPS)
2. you want to archive those files in a folder structure
3. you want to encrpyt those files with GPG for additional security
4. you want to do all the file handling using your smartphone device

## Setup using Docker (recommended)
1. Add your GPG public key into the Archiver directory using filename "public-key.gpg"
2. Build the container (note you may need to adopt the "--platform" parameter inside the Dockerfile, depending on your target platform): 
```
docker build . -t <Docker Hub user>/archiver
```
3. Push the container into your private Docker repo, e.g. Docker Hub:
```
docker push <Docker Hub user>/archiver
```
4. Start the container on your desired machine:
```
docker run -d \
	-v '/home/pi/archiver-in:/archiver-in' \
	-v '/home/pi/archiver-out:/archiver-out' \
	--env ARCHIVER_PASSWORD='desired-login-password' \
	--env ARCHIVER_SECRET='put-a-secret-string-here' \
	--env ARCHIVER_GPGPKID='id of the GPG public key you provided in the container' \
	<Docker Hub user>/archiver
```

Because Archiver relies on regular mounts into the Docker container, you can use any input and output filesystem supported by your device. E.g. use the following command to mount a Synology SMB share into your Raspberry:
```
mount -t cifs -o vers=2.0,credentials=/home/pi/smbcredentials,uid=1000,gid=1000 //<SMB host>/<SMB folder> /home/pi/archiver-in
```

A typical ``smbcredentials`` file looks as follows:
```
username=<username>
password=<password>
```

Check out Archiver's ``config.js`` for more configuration options.

## Setup on Synology NAS directly (not recommended)
* Make sure you have installed Node8 on your Synology
* Make sure to follow the dependencies mentioned in ``package.json``
* Make sure to configure application in ``config.json``
* Make sure to configure frontend in ``public/js/config-frontend.json`` (make a copy of ``config-frontend.json.template``)
* Make sure you have installed GPG on your Synology and it's accessible from the command line typing ``gpg``

### Autostart on Synology NAS
Modify /usr/local/etc/rc.d:
```
cd <archiver directory>
node index.js > archiver.log
```

## How to access
Open in a browser
```
http://<your synology IP address>:<configured port, 8080 by default>/
```