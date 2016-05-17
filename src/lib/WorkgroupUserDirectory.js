/*
    Copyright (c) 2016 eyeOS

    This file is part of Open365.

    Open365 is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

var settings = require('./settings.js');
var log2out = require('log2out');
var wait = require('wait.for');
var WorkgroupUserDirectoryBaseDir = require('./WorkgroupUserDirectoryBaseDir');
var mkdirp = require('mkdirp');
var path = require('path');
var rimraf = require('rimraf');
var UserNotifier = require('./UserNotifier');

// Each user has a username/workgroups folder with a folder for each group they
// are in. This class manages creation and deletion of the user's workgroup folders.
// Not sure of where to move it. It will need access to the eyeos FS!

var WorkgroupUserDirectory = function(waitFor, workgroupUserDirectoryBaseDir, injectedMkdirp, injectedRimraf, usersDir, userNotifier) {

	this.logger = log2out.getLogger('WorkgroupUserDirectory');
	this.usersDirectory = usersDir || path.join(settings.mountPoint.path, 'users');
	this.mkdirp = injectedMkdirp || mkdirp;
	this.rimraf = injectedRimraf || rimraf;
	this.wait = waitFor || wait;
	this.workgroupUserDirectoryBaseDir = workgroupUserDirectoryBaseDir || new WorkgroupUserDirectoryBaseDir();
	this.userNotifier = userNotifier || new UserNotifier();
};


WorkgroupUserDirectory.prototype.create = function(userName, workgroupName) {
	this.logger.trace("create workgroupUserDirectory (user: %s, workgroup: %s", userName, workgroupName);

	try {
		this.workgroupUserDirectoryBaseDir.ensureBaseUserWorkgroupDirExist(userName);
		this.userNotifier.notify('create', userName, workgroupName);
	} catch (e) {
		this.logger.error('Unable to create workgroup base directory for: ', userName, ' ,Error: ', e);
		return 'ERROR';
	}

	var userWorkgroupDirectory = this._getWorkgroupUserDirectoryPath(userName, workgroupName);
	try {
		this.wait.for(this.mkdirp, userWorkgroupDirectory, '750');
	} catch (e) {
		this.logger.error('Error trying to create user workgroup directory:', userWorkgroupDirectory, e);
		return 'ERROR';
	}
	return true;
};

WorkgroupUserDirectory.prototype.erase = function(userName, workgroupName) {
	this.logger.trace("erase workgroupUserDirectory (user: %s, workgroup: %s", userName, workgroupName);

	var userWorkgroupDirectory = this._getWorkgroupUserDirectoryPath(userName, workgroupName);
	try {
		this.logger.debug("Removing:", userWorkgroupDirectory);
		this.rimraf.sync(userWorkgroupDirectory);
		this.userNotifier.notify('delete', userName, workgroupName);
	} catch (e) {
		this.logger.error('Error trying to delete user workgroup directory:', userWorkgroupDirectory, e);
		return false;
	}
	this.logger.info('Workgroup user directory deleted.');
	return true;
};

WorkgroupUserDirectory.prototype._getWorkgroupUserDirectoryPath = function(userName, workgroupName) {
	return path.join(this.usersDirectory, userName, 'workgroups', workgroupName);
};

module.exports = WorkgroupUserDirectory;
