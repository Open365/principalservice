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

/**
 * Created by kevin on 9/1/15.
 */
var mongoose = require('mongoose');
var log2out = require('log2out');
var eyeosPrincipal = require('eyeos-principal');

function WorkgroupSystemConstraints(sysGroupModel) {
    this.logger = log2out.getLogger('WorkgroupSystemConstraints');
    this.sysGroupModel = sysGroupModel || eyeosPrincipal.SystemGroupSchema(mongoose).getModel();
}

function permissionIdForWgRole(wgId, role) {
    return "eyeos.group." + wgId + "." + role;
}

function permission(wgId, role, name, description, enabled) {
    return { id: permissionIdForWgRole(wgId, role), name: name, enabled: enabled, description: description };
}

WorkgroupSystemConstraints.prototype.ensureEyeschoolEnvironmentForWorkgroup = function (id, name, description) {
    var self = this;
    var logError = function (err) {
        if (err) {
            self.logger.error(err);
        }
    };

    var everyonePermissions = [
        permission(id, 'student', 'Student of ' + name, description, false),
        permission(id, 'teacher', 'Teacher of ' + name, description, false),
        permission(id, 'administrator', 'Administrator of ' + name, description, false)
    ];

    var studentGroup = new this.sysGroupModel({
        name: 'Student of ' + name,
        description: description,
        permissions: [ permission(id, 'student', 'Student of ' + name, description, true) ]
    });

    var teacherGroup = new this.sysGroupModel({
        name: 'Teacher of ' + name,
        description: description,
        permissions: [ permission(id, 'teacher', 'Teacher of ' + name, description, true) ]
    });

    var adminGroup = new this.sysGroupModel({
        name: 'Administrator of ' + name,
        description: description,
        permissions: [ permission(id, 'administrator', 'Administrator of ' + name, description, true) ]
    });

    this.sysGroupModel.findOne({ _id: 'EVERYONE' }, function (err, sysgroup) {
        if (err) {
            return self.logger.error(err); // ??????
        } else if (!sysgroup) {
            return self.logger.error("Everyone does not exist!");
        } else {
            everyonePermissions.forEach(function (p) {
                sysgroup.permissions.push(p);
            });
            sysgroup.save(logError);
        }

        [ studentGroup, teacherGroup, adminGroup ].forEach(function (wg) {
            wg.save(logError);
        });
    });
};

module.exports = WorkgroupSystemConstraints;
