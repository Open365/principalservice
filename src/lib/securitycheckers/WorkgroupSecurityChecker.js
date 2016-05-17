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

var SecurityChecker = require('./SecurityChecker');
var log2out = require('log2out');

var WorkgroupSecurityChecker = function(securityChecker) {
	this.securityChecker = securityChecker || new SecurityChecker();
	this.logger = log2out.getLogger('WorkgroupSecurityChecker');

};

WorkgroupSecurityChecker.prototype.check = function(req, res, next) {
	if (req.method === 'DELETE') {
		var groupId = this.extractGroupId(req);
		this.logger.info('checking permisions to delete:', groupId);
		if (!this.securityChecker.isAdmin(req, groupId)) {
			res.send(403);
		} else {
			next();
		}
	} else {
		next();
	}
};

WorkgroupSecurityChecker.prototype.extractGroupId = function(req) {
	var groupId = req.path.replace(/^\/|\/$/g, ''); //remove slashes
	return groupId;
};

module.exports = WorkgroupSecurityChecker;
