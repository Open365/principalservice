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

var MembershipSecurityChecker = function(securityChecker) {
	this.securityChecker = securityChecker || new SecurityChecker();
	this.logger = log2out.getLogger('MembershipSecurityChecker');

};

MembershipSecurityChecker.prototype.setSecurityChecker=function(securityChecker) {
    this.securityChecker = securityChecker;
};

MembershipSecurityChecker.prototype.check = function(req, res, next) {
	if (req.method === 'POST' || req.method === 'PUT') {
		var memberships = this.extractGroupIdFromBody(req);
		this.logger.info('Checking permisions to POST or PUT:', memberships);
		var self = this;
        var hasUnauthorizedMembership = memberships.some(function(membership) {
            return !self.securityChecker.isAdmin(req, membership.groupId);
        });
        if (hasUnauthorizedMembership) {
			res.send(403);
		}
        else {
			next();
		}
	} else if (req.method === 'DELETE') {
		var groupId = this.extractGroupIdFromPath(req);
		this.logger.info('Checking permisions to DELETE:', groupId);
		this.checkIsAdmin(req, res, next, groupId);
	} else {
		next();
	}
};

MembershipSecurityChecker.prototype.checkIsAdmin = function (req, res, next, groupId) {
	if (!this.securityChecker.isAdmin(req, groupId)) {
		res.send(403);
	}
    else
    {
        next();
    }
};

MembershipSecurityChecker.prototype.extractGroupIdFromBody = function (req) {
    if (req.body.groupId) {
		return [req.body];
	}
    return req.body;
};

MembershipSecurityChecker.prototype.extractGroupIdFromPath = function (req) {
    var query=JSON.parse(req.query.conditions);
	return query["$and"][0].groupId; //remove slashes
};


module.exports = MembershipSecurityChecker;
