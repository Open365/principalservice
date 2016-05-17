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
var WorkGroupSchema = require('./models/WorkGroupSchema');
var wait=require('wait.for');
var WorkgroupDirectory = require('./WorkgroupDirectory');

// Makes WorkgroupDirectory compatible with express.js.
var WorkgroupDirectoryExpressAdapter = function(waitFor, workgroupDirectory) {
    this.logger = log2out.getLogger('WorkgroupDirectoryExpressAdapter');
    this.workgroupModel = mongoose.model('workgroup', WorkGroupSchema);
    this.wait = waitFor || wait;
    this.workgroupDirectory = workgroupDirectory || new WorkgroupDirectory();
};


WorkgroupDirectoryExpressAdapter.prototype.create = function(req, res, next) {
    var workgroupName = req.body.name;
    if (workgroupName === undefined) {
        this.logger.info('No workgroup name provided.');
        res.send(400);
        return;
    }

    try {
        this.workgroupDirectory.create(workgroupName);
        next();
    } catch (err) {
        this.logger.error("Got error when creating workgroup directory for workgroup %s", workgroupName, err);
        var httpStatus;
        switch (err.code) {
            case "ERR_WORKGROUP_EXISTS":
            case "ERR_WORKGROUP_NAME_INVALID":
                httpStatus = 400;
                break;
            case "ERR_MKDIR_WORKGROUP":
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


WorkgroupDirectoryExpressAdapter.prototype.erase = function(req, res, next) {
    var workgroupId = this._extractWorkgroupId(req);

    if (workgroupId === undefined) {
        this.logger.info('No workgroup provided.');
        res.send(400);
        return;
    }

    try {
        var workgroupName = this._getWorkgroupName(workgroupId);
        if (workgroupName === null) {
            this.logger.error('The workgroup does not exist.');
            res.send(404);
            return;
        }
    } catch (e) {
        this.logger.error('Error getting workgroup name.', e);
        res.send(500);
        return;
    }
    var result = this.workgroupDirectory.erase(workgroupName);
    if (result !== true) {
        if (result === 'ENOENT') {
            res.send(400); // The workgroup already exist
            return;
        } else {
            res.send(500); // We can't create the directory, so internal error
            return;
        }
    }

    this.logger.info('Workgroup deleted.');
    next();

};

WorkgroupDirectoryExpressAdapter.prototype.update = function(req, res, next) {
    var workgroupName = req.body.name;
    if (workgroupName === undefined) {
        this.logger.info('No workgroup name provided.');
        res.status(400);
        res.end('No workgroup name provided.');
        return;
    }

    var result = this.workgroupDirectory.update(workgroupName);
    if (result === 'INVALID') {
            res.status(400);
            res.end('The name \"'+ workgroupName + '\" is not valid. Please choose a different name.');
    }
    next();
};

WorkgroupDirectoryExpressAdapter.prototype._getWorkgroupName = function(workgroupId) {
    var workgroup = this.wait.forMethod(this.workgroupModel, 'findById', workgroupId);
    return workgroup ? workgroup.name : null;
};

WorkgroupDirectoryExpressAdapter.prototype._extractWorkgroupId = function(req) {
    var groupId = req.path.split('/')[2];
    return groupId;
};


module.exports = WorkgroupDirectoryExpressAdapter;
