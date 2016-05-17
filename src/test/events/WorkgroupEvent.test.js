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
var WorkgroupEvent = require('../../lib/events/WorkgroupEvent');
var sinon = require('sinon');

suite("WorkgroupEvent", function () {
    function makeMessage(method, target, body) {
        function returning(value) { return function () { return value; }; }

        return { method: returning(method), target: returning(target), body: returning(body) };
    }

    function makeEvent() {
        return new WorkgroupEvent({ post: sinon.spy() });
    }

    suite("domain constraints", function () {
        test("can't build an event without a client", function () {
            function makeEvent() {
                return new WorkgroupEvent();
            }

            assert.throw(makeEvent);
        });
    });

    var noop = function (err) {
        if (err) throw err;
    };

    suite("emit", function () {
        suite("constraints", function () {
            test("should only accept a message with a method", function () {
                function emitMessage() {
                    var msg = makeMessage(undefined, 'target', 'body');
                    makeEvent().emit(msg, noop);
                }

                assert.throw(emitMessage);
            });

            test("should only accept a message with a target", function () {
                function emitMessage() {
                    var msg = makeMessage('method', undefined, 'body');
                    makeEvent().emit(msg, noop);
                }

                assert.throw(emitMessage);
            });
        });

        suite("messaging", function () {
            test("it should send a message and forget about response", function () {
                function emitMessage() {
                    var msg = makeMessage('post', 'target', 'body');
                    var event = makeEvent();
                    event.emit(msg, noop);
                    return event.client.post;
                }

                var emitter = emitMessage();
                assert.isTrue(emitter.calledWithExactly('target', {}, 'body'));
            });

            test("it should run the callback with the message has been emitted", function () {
                function emitMessage() {
                    var spy = sinon.spy();
                    var msg = makeMessage('post', 'target', 'body');
                    var event = makeEvent();
                    event.emit(msg, spy);
                    return spy;
                }

                var listener = emitMessage();
                assert.isTrue(listener.calledWithExactly());
            });

            test("it should run the callback with an error when the message is invalid", function () {
                function emitMessage() {
                    var spy = sinon.spy();
                    var msg = makeMessage(undefined, 'target', 'body');
                    var event = makeEvent();
                    event.emit(msg, spy);
                    return spy;
                }

                var listener = emitMessage();
                assert.isTrue(listener.calledWith(sinon.match.instanceOf(Error)));
            });
        });
    });
});
