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
var Client = require('eyeos-consume-service').Client;
var WorkgroupEvent = require('./WorkgroupEvent');
var WorkgroupMessage = require('./messages/WorkgroupMessage');
var settings = require('../settings');
var WorkgroupSystemConstraints = require('../constraints/WorkgroupSystemConstraints');

var noop = function () {};

function WorkgroupEventService(event) {
    this.event = event || new WorkgroupEvent(new Client(settings.WorkgroupEventsQueue));
}

WorkgroupEventService.prototype.workgroupCreated = function (id, name, description, extras, callback) {
    var message = new WorkgroupMessage.WorkgroupCreatedMessage(id, name, description, extras);
    this.event.emit(message, callback || noop);
};

function DirectWorkgroupEventService(workgroupSystemConstraintFacade) {
    this.systemConstraints = workgroupSystemConstraintFacade || new WorkgroupSystemConstraints;
}

DirectWorkgroupEventService.prototype.workgroupCreated = function (id, name, description, extras) {
    if (extras.resource === "eyeschool") {
        this.systemConstraints.ensureEyeschoolEnvironmentForWorkgroup(id, name, description);
    }
};

WorkgroupEventService.Direct = DirectWorkgroupEventService;

module.exports = WorkgroupEventService;
