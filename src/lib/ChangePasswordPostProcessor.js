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
var EyeCrypt = require('eyeos-crypt').EyeCrypt;
var settings = require('./settings');

function ChangePasswordPostProcessor(injSettings, injConsumeService) {
	this.settings = injSettings || settings.userEvents;
	this.logger = log2out.getLogger('ChangePasswordPostProcessor');
	this.consumeService = injConsumeService || new Client(this.settings.exchange);
	this.eyeCrypt= new EyeCrypt(this.settings.crypto);
}

ChangePasswordPostProcessor.prototype.process = function (userData, cb) {
	this.logger.debug('Starting after changePassword actions:', arguments);
	cb = cb || function() {};

	var self = this;
	console.log("UserDATA", userData);
	this.eyeCrypt.encrypt(userData.newPassword, function(err, newPassEncrypted) {
		if (err) {
			err = new Error("Failed ot encrypt password " + err);
			self.logger.error(err);
			return cb(err);
		}
		self.eyeCrypt.encrypt(userData.oldPassword, function(err, oldPassEncrypted) {
			if (err) {
				err = new Error("Failed ot encrypt password " + err);
				self.logger.error(err);
				return cb(err);
			}

			var headers = {};
			var msg = {
				username: userData.username,
				oldPassword: oldPassEncrypted,
				newPassword: newPassEncrypted,
				card: userData.card
			};
			self.consumeService.post(self.settings.exchange.postUrl, headers, JSON.stringify(msg), null /*replyTo*/, cb);
		});
	});
}

module.exports = ChangePasswordPostProcessor;
