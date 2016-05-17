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

var logger = require('log2out').getLogger('WorkgroupProviderExpressAdapter');
var WorkgroupProvider = require('./WorkgroupProvider');
var WorkgroupProviderErrorHandler = require('./WorkgroupProviderErrorHandler');
var RequestParser = require('./utils/RequestParser');

// Makes workgroupProvider compatible with express.
var WorkgroupProviderExpressAdapter = function (workgroupProvider, requestParser, workgroupProviderErrorHandler) {
	this.workgroupProvider = workgroupProvider || new WorkgroupProvider();
	this.requestParser = requestParser || new RequestParser();
	this.errorHandler = workgroupProviderErrorHandler || new WorkgroupProviderErrorHandler();
};

WorkgroupProviderExpressAdapter.prototype.getUserWorkgroups = function (req, res, next) {
	var userId = this.requestParser.extractUserIdFromHeaders(req);

	try {
		var result = this.workgroupProvider.getUserWorkgroups(userId);
		res.json(result);
	} catch (err) {
		logger.error("Got error when getting workgroups for user " + userId, err);
		this.errorHandler.handle(err, res);
	}
};


WorkgroupProviderExpressAdapter.prototype.getWorkgroupMembers = function (req, res, next) {
	var id = req.params[0];
	try {
		var result = this.workgroupProvider.getWorkgroupMembers(id);
		res.json(result);
	} catch (err) {
		logger.error("Got error when getting members for workgroup " + id, err);
		this.errorHandler.handle(err, res);
	}

};

module.exports = WorkgroupProviderExpressAdapter;
