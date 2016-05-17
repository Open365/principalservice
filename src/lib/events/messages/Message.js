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

var settings = require('../../settings');

function Message(method, target) {
    if (!method) {
        throw new Error("A Message without method is disallowed");
    }

    if (!target) {
        throw new Error("A message without a target is disallowed");
    }

    this.requestMethod = method;
    this.queueTarget = target;
}

Message.prototype.method = function () {
    return this.requestMethod;
};

Message.prototype.target = function () {
    return this.queueTarget;
};

Message.inheritedBy = function (defaultMethod, defaultTarget) {
    var ct = this.constructor.name;
    var method = settings.messages[ct].method || defaultMethod;
    var target = settings.messages[ct].target || defaultTarget;

    Message.bind(this)(method, target);
};

module.exports = Message;
