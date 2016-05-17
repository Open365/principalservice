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
 * Created by kevin on 8/31/15.
 */

var Message = require('./Message');

function WorkgroupCreatedMessage(id, name, description, extras) {
    Message.inheritedBy.bind(this)('post', 'amqp://permissions/v2/workgroups/');

    this.message = { workgroup: { id: id, name: name, description: description, extras: extras } };
}

WorkgroupCreatedMessage.prototype = Object.create(Message.prototype); // inheritance breaks this.constructor reference
WorkgroupCreatedMessage.prototype.constructor = WorkgroupCreatedMessage;

WorkgroupCreatedMessage.prototype.body = function () {
    return this.message;
};

module.exports.WorkgroupCreatedMessage = WorkgroupCreatedMessage;
