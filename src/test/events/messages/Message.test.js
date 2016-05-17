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
var Message = require('../../../lib/events/messages/Message');

suite("Message", function () {
    suite("domain constraints", function () {
        test("can't build a message without method", function () {
            function makeMessage() {
                return new Message();
            }

            assert.throw(makeMessage);
        });

        test("can't build a message without target", function () {
            function makeMessage() {
                return new Message('post');
            }

            assert.throw(makeMessage);
        });
    });

    function makeMessage() {
        return new Message(makeMessage.method, makeMessage.target);
    }

    makeMessage.method = 'post';
    makeMessage.target = 'toTarget';

    suite("method", function () {
        test("it should return the provided method", function () {
            var msg = makeMessage();
            assert.equal(msg.method(), makeMessage.method);
        });
    });

    suite("target", function () {
        test("it should return the provided target", function () {
            var msg = makeMessage();
            assert.equal(msg.target(), makeMessage.target);
        });
    });
});
