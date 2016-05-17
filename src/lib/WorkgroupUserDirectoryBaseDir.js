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

var fs = require('fs');
var settings = require('./settings.js');
var log2out = require('log2out');

// Creates the workgroup directory structure, allowing a user to use workgroups.
var WorkgroupUserDirectoryBaseDir = function(injectedFs) {
	this.logger = log2out.getLogger('WorkgroupUserDirectoryBaseDir');
	this.fs = injectedFs || fs;
};

WorkgroupUserDirectoryBaseDir.prototype.ensureBaseUserWorkgroupDirExist = function(userId) {
	this._ensureDirExist(settings.mountPoint.path + '/users/' + userId);
	this._ensureDirExist(settings.mountPoint.path + '/users/' + userId + '/workgroups/');
};

WorkgroupUserDirectoryBaseDir.prototype._ensureDirExist = function(path) {
	try {
		this.fs.mkdirSync(path);
	} catch (e) {
		if (e.code === 'EEXIST') {
			this.logger.info('Directory already exist, no need to create it: ', path);
		} else {
			throw e;
		}
	}
};

module.exports = WorkgroupUserDirectoryBaseDir;
