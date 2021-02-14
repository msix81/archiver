# Archiver
This is a web portal application to archive documents on a Synology device. Standard use case:
1. you scan your documents and letters with a scanner directly onto your Synology device (e.g. via FTPS)
2. you want to archive those files in a folder structure
3. you want to encrpyt those files with GPG for additional security
4. you want to do all of this using your smartphone device

## Setup
* Make sure you have installed Node8 on your Synology
* Make sure to follow the dependencies mentioned in ``package.json``
* Make sure to configure application in ``config.json``

## Autostart
Modify /usr/local/etc/rc.d:
```
cd <archiver directory>
node index.js > archiver.log
```

## How to access
Open in a browser
```
http://<your synology IP address>:7554/
```
