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

var log2out = require('log2out');

function WorkgroupEvent(client, logger) {
    this.logger = logger || log2out.getLogger('events.WorkgroupEvent');
    if (client) {
        this.client = client;
    } else {
        throw new Error('WorkgroupEvent: Client must be defined');
    }
}

WorkgroupEvent.prototype.emit = function (message, callback) {
    var target = message.target();
    var method = message.method();

    if (!target) {
        return callback(new Error("Message must provide the target where it's sent; Message#target"));
    }

    if (!method) {
        return callback(new Error("Message must provide the method of the request; Message#method"));
    }

    this.client[method](target, {}, message.body());
    return callback();
};

module.exports = WorkgroupEvent;
