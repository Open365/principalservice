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

var logger = require('log2out').getLogger('MembersNotifierExpressAdapter');
var MembersNotifier = require('./MembersNotifier');

var MembersNotifierExpressAdapter = function (membersNotifier) {
    this.membersNotifier = membersNotifier || new MembersNotifier();
};

// extracts user and group id from the request to call MembersNotifier properly.
MembersNotifierExpressAdapter.prototype.userRemovedFromWorkgroup = function (req, res, next) {
    var groupId = this._extractGroupIdFromPath(req);

    var membersIds = this._extractMemberIdsFromPath(req);

    for(var i = 0; i < membersIds.length; i++) {
        this.membersNotifier.userRemovedFromWorkgroup(membersIds[i], groupId);
    }
};

MembersNotifierExpressAdapter.prototype._extractGroupIdFromPath = function (req) {
    var query=JSON.parse(req.query.conditions);
    return query["$and"][0].groupId;
};

MembersNotifierExpressAdapter.prototype._extractMemberIdsFromPath = function (req) {
    var query=JSON.parse(req.query.conditions);
    return query["$and"][1]["memberId"]["$in"];
};

module.exports = MembersNotifierExpressAdapter;
