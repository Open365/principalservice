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

'use strict';
var logger = require('log2out').getLogger('systemgroupsapi.ManageProfilePermissionChecker');
var EyeosAuth = require('eyeos-auth');

function ManageProfilePermissionChecker (eyeosAuth) {
	this.eyeosAuth = eyeosAuth || new EyeosAuth();
}

ManageProfilePermissionChecker.MANAGE_PROFILE_PERMISSION = 'eyeos.admin.profiles.edit';

ManageProfilePermissionChecker.prototype.check = function (request, response, next) {
	var hasManageProfilePermission = this.eyeosAuth.hasPermission(request, ManageProfilePermissionChecker.MANAGE_PROFILE_PERMISSION);
	if (!hasManageProfilePermission) {
		logger.debug('<<< next(Error("It is forbidden to GET, POST or PUT or DELETE anything without eyeos.admin.profiles.edit permission"))');
		next(new Error("It is forbidden to GET, POST, PUT or DELETE anything without eyeos.admin.profiles.edit permission"));
	}
	next();
};

module.exports = ManageProfilePermissionChecker;
