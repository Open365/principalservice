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

var PermissionsServiceProvider = require('./PermissionsServiceProvider');
var settings = require('./settings.js');
var log2out = require('log2out');

// Called after save on mongoose. Only logs and sends notifications to the clients.
// the mongoose save and notifications should be integrated. Avoid using the
// mongoose middlewares.

var WorkgroupPermissions = function(permissionsServiceProvider) {
	this.logger = log2out.getLogger('WorkgroupPermissions');
	this.permissionsServiceProvider = permissionsServiceProvider || new PermissionsServiceProvider();
};

WorkgroupPermissions.prototype.add = function(groupId, req) {
	var permission = this._getGroupAdminPermission(groupId);
	this.logger.info('Adding permission: ', permission, ' to: ', req.headers.card);
    this.permissionsServiceProvider.addPermissions(permission, req.headers.card, req.headers.signature);
};

WorkgroupPermissions.prototype.remove = function(groupId, req) {
	var permission = this._getGroupAdminPermission(groupId);
	this.logger.info('Removing permission: ', permission, ' to: ', req.headers.card);
	this.permissionsServiceProvider.removePermissions(permission, req.headers.card, req.headers.signature);
};

WorkgroupPermissions.prototype._getGroupAdminPermission = function(groupId) {
	return 'eyeos.group.' + groupId + '.administrator';
};


module.exports = WorkgroupPermissions;
