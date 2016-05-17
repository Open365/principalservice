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

var logger = require('log2out').getLogger('SubjectProviderExpressAdapter');
var SubjectProvider = require('./SubjectProvider');
var RequestParser = require('./utils/RequestParser');

// Makes subjectProvider compatible with express.
var SubjectProviderExpressAdapter = function (subjectProvider, requestParser) {
    this.subjectProvider = subjectProvider || new SubjectProvider();
    this.requestParser = requestParser || new RequestParser();
};

SubjectProviderExpressAdapter.prototype.getUserSubjects = function (req, res, next) {
    var userId = this.requestParser.extractUserIdFromHeaders(req);

    try {
        var result = this.subjectProvider.getUserSubjects(userId);
        res.json(result);
    } catch (err) {
        logger.error("Got error when getting subjects for user " + userId, err);
        var httpStatus;
        switch (err.code) {
            case "ERR_MODEL_GET_SUBJECT_BY_ID":
            case "ERR_MODEL_GET_SUBJECT_MEMBERSHIPS":
                httpStatus = 500;
                break;
            default:
                // VERY IMPORTANT! ALWAYS THROW THE ERR FOR UNHANDLED err.code
                throw err;
        }
        res.status(httpStatus);
        res.send(err.getPublicInfo(httpStatus >= 500));
    }
};

module.exports = SubjectProviderExpressAdapter;
