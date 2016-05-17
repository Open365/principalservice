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

var log2out = require('log2out');
var Client = require('eyeos-consume-service').Client;
var settings = require('./settings.js');


// Notifies users when they have permissions added/removed.
// to be moved to the library

// Should be renamed to somethingNotifier as this doesn't provide anything.

var PermissionsServiceProvider = function (client, permissionsQueueSettings) {
	this.logger = log2out.getLogger('PermissionsServiceProvider');
	this.permissionsQueueSettings = permissionsQueueSettings || settings.PermissionsQueue;
	this.client = client || new Client(this.permissionsQueueSettings);
};

PermissionsServiceProvider.prototype.addPermissions = function (permissions, userCard, signature) {
	this.logger.debug('addPermissions', permissions, userCard, signature);
	this._send('put', permissions, userCard, signature);
};

PermissionsServiceProvider.prototype.removePermissions = function (permissions, userCard, signature) {
	this.logger.debug('removePermissions', permissions, userCard, signature);
	this._send('delete', permissions, userCard, signature);
};

PermissionsServiceProvider.prototype._send = function (verb, permissions, userCard, signature) {

	var headers = {
		card: userCard,
		signature: signature
	};

	var parsedUserCard = JSON.parse(userCard);
	var body = {
		permissions: permissions
	};

	var url = this.permissionsQueueSettings.url + parsedUserCard.username + '/permissions';

	this.logger.debug('Publishing to: ', url);

	this.client[verb](url, headers, body);
};


module.exports = PermissionsServiceProvider;
