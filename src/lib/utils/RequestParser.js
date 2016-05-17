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

var logger = require('log2out').getLogger('RequestParser');


var RequestParser = function () {
};

RequestParser.prototype.extractUserIdFromHeaders = function (req) {
	var card = this.extractCardFromHeaders(req);
	return card.username;
};

RequestParser.prototype.extractDomainFromHeaders = function (req) {
	var card = this.extractCardFromHeaders(req);
	return card.domain;
};

RequestParser.prototype.extractCardFromHeaders = function (req) {
	var card;

	if (!req) {
		throw new Error('No request given');
	}

	try {
		card = JSON.parse(req.headers.card);
	} catch (err) {
		logger.error("Can't extract card from request headers: ", req.headers);
		throw new Error("Can't extract card from request headers: "+JSON.stringify(req.headers));
	}

	if (!card) {
		throw new Error("No card found in request headers: "+JSON.stringify(req.headers));
	}

	return card;
};

module.exports = RequestParser;
