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

var assert = require('chai').assert;
var WorkgroupMessage = require('../../../lib/events/messages/WorkgroupMessage');

[
    { type: 'WorkgroupCreatedMessage', method: 'post', target: 'amqp://permissions/v2/workgroups/' }
].forEach(function (_) {
    suite(_.type, function () {
        var Method = _.method;
        var Target = _.target;

        function makeMessage(id, name, description, extras) {
            return new WorkgroupMessage[_.type](id || makeMessage.id, name || makeMessage.name, description || makeMessage.description, extras || makeMessage.extras);
        }

        makeMessage.id = 'id';
        makeMessage.name = 'workspace';
        makeMessage.description = 'description';
        makeMessage.extras = { color: '#ff0000' };

        suite("constraints", function () {
            test("that the method is " + Method, function () {
                assert.equal(makeMessage().method(), Method);
            });

            test("that the target is " + Target, function () {
                assert.equal(makeMessage().target(), Target);
            });
        });

        suite("body", function () {
            test("body should be formatted as a workgroup object", function () {
                var msg = makeMessage();
                assert.deepEqual(msg.body(), { workgroup: { id: makeMessage.id, name: makeMessage.name, description: makeMessage.description, extras: makeMessage.extras } });
            });
        });
    });
});