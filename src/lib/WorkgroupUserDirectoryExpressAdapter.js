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

var settings = require('./settings.js');
var log2out = require('log2out');
var mongoose = require('mongoose');
var wait=require('wait.for');
var WorkGroupSchema = require('./models/WorkGroupSchema');
var MembershipSchema = require('./models/MembershipSchema');
var WorkgroupUserDirectory = require('./WorkgroupUserDirectory');
var WorkgroupUserDirectoryBaseDir = require('./WorkgroupUserDirectoryBaseDir');
var WorkgroupUserDirectoryCommandBase = require("./WorkgroupUserDirectoryCommandBase");

// Makes WorkgroupUserDirectory compatible with express. This probably has
// too much logic deleting the group (it deletes folders in each user's directory).

var WorkgroupUserDirectoryExpressAdapter = function(workgroupUserDirectory, waitFor, workgroupUserDirectoryBaseDir) {
    WorkgroupUserDirectoryCommandBase.apply(this);
    this.logger = log2out.getLogger('WorkgroupUserDirectoryExpressAdapter');
    this.usersDirectory = settings.mountPoint.path + '/users/';
    this.workgroupModel = mongoose.model('workgroup', WorkGroupSchema);
    this.membershipModel = mongoose.model('membership', MembershipSchema);
    this.wait = waitFor || wait;
    this.workgroupUserDirectory = workgroupUserDirectory || new WorkgroupUserDirectory();
    this.workgroupUserDirectoryBaseDir = workgroupUserDirectoryBaseDir || new WorkgroupUserDirectoryBaseDir();
};

WorkgroupUserDirectoryExpressAdapter.prototype=new WorkgroupUserDirectoryCommandBase();


WorkgroupUserDirectoryExpressAdapter.prototype.erase = function(req, res, next) {
    this.logger.info('Deleting workgroup directory');

    var groupId = this._extractGroupIdFromPath(req);

    try {

        var workgroupName = this._getWorkgroupName(groupId);
    } catch (e) {
        this.logger.error('Error getting workgroup name.', e);
        res.send(500);
        return;
    }

    var membersIds = this._extractMemberIdsFromPath(req);

    var error = false;
    for(var i = 0; i < membersIds.length; i++) {

        var result = this.workgroupUserDirectory.erase(membersIds[i], workgroupName);
        if (result !== true) {
            this.logger.error("Error deleting folder from workgroup '%s' in user '%s'", workgroupName, membersIds[i]);
            error = true;
        }
    }
    if (error === true) {
        res.send(500);
        return;
    } else {
        next();
        return;
    }
};

WorkgroupUserDirectoryExpressAdapter.prototype.create = function(req, res, next) {
    this._execCommand(req, res, next, function(membershipDTO)
    {
        var userId = membershipDTO.memberId;
        var workgroupId = membershipDTO.groupId;

        try {
            var workgroupName = this._getWorkgroupName(workgroupId);
        } catch (e) {
            this.logger.error('Error getting workgroup name.', e);
            res.send(500);
            return;
        }

        var result = this.workgroupUserDirectory.create(userId, workgroupName);

        if (result !== true) {
            if (result === 'EEXIST') {
                res.send(400); // The workgroup already exist
                return;
            } else {
                res.send(500); // We can't create the directory, so internal error
                return;
            }
        }
    });
};


// Use the eyeos path library instead of custom methods in each class.
WorkgroupUserDirectoryExpressAdapter.prototype._getWorkgroupName = function(workgroupId) {
    var workgroup = this.wait.forMethod(this.workgroupModel, 'findById', workgroupId);
    return workgroup.name;
};

WorkgroupUserDirectoryExpressAdapter.prototype._extractGroupIdFromPath = function (req) {
    var query=JSON.parse(req.query.conditions);
    return query["$and"][0].groupId;
};

WorkgroupUserDirectoryExpressAdapter.prototype._extractMemberIdsFromPath = function (req) {
    var query=JSON.parse(req.query.conditions);
    return query["$and"][1]["memberId"]["$in"];
};


module.exports = WorkgroupUserDirectoryExpressAdapter;
