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

var logger = require('log2out').getLogger('MembershipProviderExpressAdapter');
var RequestParser = require('./utils/RequestParser');

// Used when you post to memberships. When you post to memberships, you send
// an array of {systemGroupId: "SystemId", memberId: "memberId"}
var MembershipProviderExpressAdapter = function (requestParser) {
	this.requestParser = requestParser || new RequestParser();
};

MembershipProviderExpressAdapter.prototype.removeCurrentUserFromBody = function (req, res, next) {
	var userId = this.requestParser.extractUserIdFromHeaders(req);

	for(var i = 0, max=req.body.length; i<max; i++) {
		if(req.body[i].memberId === userId) {
			req.body.splice(i, 1);
			break;
		}
	}

	if(req.body.length > 0) {
		next();
	} else {
		res.send(200);
	}
};

module.exports = MembershipProviderExpressAdapter;
