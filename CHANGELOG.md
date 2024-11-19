# 📋 Change Log

## 🔹 1.2.0

* Improvement: Added a cache to store directories content, this will improve some file operations like: renaming a file, create a file, create a directory, delete a file/directory.
* Added: Added contextual action "SFTP Dir: Refresh directory content" to refresh the content of a directory, use this action when you have made changes to a directory from SFTP server and you want to see the changes in the file explorer.
* Feature: Changed minimum version of engine to 1.93.0, this will allow extensions to work with VSCode 1.93.0 and above.

## 🔹 1.1.2

* Improvement: Validation of SFTP connection is now done after 60 seconds to speed-up SFTP operations on SFTP servers with high latency.
* Improvement: Directories are now cached when required and not on every SFTP operation to speed-up STP operations on SFTP servers with high latency.

## 🔹 1.1.1

* Improvement: Added validation to SFTP connections to check if connection is still valid before any SFTP operation, if connection is not valid a new connection is created and the previous connection is removed from the pool of connections.

## 🔹 1.1.0

* Fixed: When uploading files to the remote server, folder was always uploaded with a lowercase name regardless if folder name contained uppercase and lowercase letters. This has been fixed, and uploads are now handled correctly.
* Feature: A file metadata cache was added to improve upload and download times for multiple files without needing to query the remote server for already know metadata. Setting `sftpfs.cache.metadata.files.seconds` has been added to control this behavior.
* Feature: Implemented contextual menu actions "SFTP File Sync: 1. Remote → Local (download)" and "SFTP File Sync: 2. Local → Remote (upload)" to download/upload a single file from/to remote server.
* Improvement: The "Reveal in File Explorer" action has been improved; it now selects the file in system file explorer.
* Improvement: Files uploaded via VSCode file explorer now uses the setting `sftpfs.behavior.notification.upload.fileSize` to display a progressive notification when a file is uploaded.

## 🔹 1.0.1

A minor update to update marketplace page.

* Updated README.

## 🔹 1.0.0

Initial release of the extension with many features:

* View, create, edit, delete, move, and rename files/directories directly from the VS Code file explorer.
* Download entire directories from SFTP to local storage (right-click a folder and select "Sync Local -> Remote" from the context menu).
* Upload entire directories from local storage to SFTP (right-click a folder and select "Sync Remote -> Local" from the context menu).
* Sync folders between both directions, local <-> SFTP (right-click a folder and select "Sync Remote <-> Local" from the context menu).
* Added configurations to manage settings for SFTP connection pools used by the extension.
* Option in the context menu to disconnect from the SFTP server.
* Option in the context menu to remove local copies of remote files without deleting the remote files (right-click a folder and select "Remove local file").