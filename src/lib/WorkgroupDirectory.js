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
var path = require('path');
var PrincipalNameValidator = require('./utils/PrincipalNameValidator');
var PrincipalServiceError = require('./utils/PrincipalServiceError');
var rimraf = require('rimraf');
var util = require('util');


// Manages creation and deletion of the workgroups folders.
// Not sure of where to move it. It will need access to the eyeos FS!

var WorkgroupDirectory = function(injectedFs, principalNameValidator, injectedRimraf) {
	this.logger = log2out.getLogger('WorkgroupDirectory');
	this.rimraf = injectedRimraf || rimraf;
	this.fs = injectedFs || fs;
	this.workgroupsDirectory = path.join(settings.mountPoint.path, 'workgroups');
	this.principalNameValidator = principalNameValidator || new PrincipalNameValidator();
	// TODO: remove this logic from the constructor if possible
	this._createMainWorkgroupDir();
};

WorkgroupDirectory.prototype.create = function(workgroupName) {
	if (!this.principalNameValidator.isNameValid(workgroupName)) {
		this.logger.info('Workgroup name %s includes invalid chars: %s', workgroupName, this.principalNameValidator.invalidadCharsRegex);
		throw new PrincipalServiceError(
			"Tried to create a workgroup (" + workgroupName + ") with invalid chars",
			"ERR_WORKGROUP_NAME_INVALID",
			{
				workgroupName: workgroupName
			}
		);
	}

	var workgroupDirectory = path.join(this.workgroupsDirectory, workgroupName);
	try {
		this.fs.mkdirSync(workgroupDirectory, '750');
	} catch (e) {
		var err;
		this.logger.error('Error trying to create workgroup directory:', workgroupDirectory, e);
		if (e.code === 'EEXIST') {
			err = new PrincipalServiceError(
				util.format("Folder for workgroup '%s' (%s) already exists", workgroupName, workgroupDirectory),
				"ERR_WORKGROUP_EXISTS",
				{
					workgroupName: workgroupName
				},
				e
			);
		} else {
			err = new PrincipalServiceError(
				util.format("Error creating folder for workgroup '%s' (%s)", workgroupName, workgroupDirectory),
				"ERR_MKDIR_WORKGROUP",
				{
					workgroupName: workgroupName
				},
				e
			);
		}
		throw err;
	}
	this.logger.info('Workgroup %s created (%s).', workgroupName, workgroupDirectory);
	return true;
};

WorkgroupDirectory.prototype.erase = function(workgroupName) {
	var workgroupDirectory = path.join(this.workgroupsDirectory, workgroupName);
	try {
		this.rimraf.sync(workgroupDirectory);
	} catch (e) {
		this.logger.error('Error trying to delete workgroup directory:', workgroupDirectory, e);
		if (e.code === 'ENOENT') {
			return 'ENOENT';
		} else {
			return 'ERROR';
		}
	}
	return true;
};

WorkgroupDirectory.prototype.update = function(workgroupName) {
	if (!this.principalNameValidator.isNameValid(workgroupName)) {
		this.logger.info('Workgroup name ' + workgroupName + ' includes invalid chars: ' + this.principalNameValidator.invalidadCharsRegex);
		return "INVALID";
	}
	return true;
};

WorkgroupDirectory.prototype._createMainWorkgroupDir = function() {
	try {
		this.fs.mkdirSync(this.workgroupsDirectory, '750');
	} catch (e) {
		if (e.code === 'EEXIST') {
			this.logger.info('Workgroups directory exist, no need to create it.');
		} else {
			throw e;
		}
	}
};

module.exports = WorkgroupDirectory;
