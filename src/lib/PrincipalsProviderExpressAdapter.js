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
var PrincipalsProvider =  require('./PrincipalsProvider');

// Used when you post to memberships. When you post to memberships, you send
// an array of {systemGroupId: "SystemId", memberId: "memberId"}
var PrincipalsProviderExpressAdapter = function (principalsProvider, writableFields) {
	this.principalsProvider = principalsProvider || new PrincipalsProvider();
	this.requestParser = new RequestParser();
	this.writableFields = writableFields || "preferences";
};


PrincipalsProviderExpressAdapter.prototype.getMe = function (req, res, next) {
	var principalId = this.requestParser.extractUserIdFromHeaders(req);
	var domain = this.requestParser.extractDomainFromHeaders(req);

	this.principalsProvider.get(principalId, domain, function (err, data) {
		if (err) {
			return res.status(500).send("");
		}

		res.status(200).send(data);
	});
};

PrincipalsProviderExpressAdapter.prototype.putMe = function (req, res, next) {
	var principalId = this.requestParser.extractUserIdFromHeaders(req);
	var domain = this.requestParser.extractDomainFromHeaders(req);

	var allowedWriteFields = this.writableFields;

	if (!Array.isArray(allowedWriteFields)) {
		allowedWriteFields = allowedWriteFields.split(/\s+/);
	}

	var forbidden;
	Object.keys(req.body).forEach(function (attr) {
		if (allowedWriteFields.indexOf(attr) === -1) {
			forbidden = true;
		}
	});

	if (forbidden) {
		return res.status(403).send("");
	}

	this.principalsProvider.put(principalId, domain, req.body, function (err, data) {
		if (err) {
			return res.status(500).send("");
		}

		res.status(200).send(data);
	});
};

module.exports = PrincipalsProviderExpressAdapter;
