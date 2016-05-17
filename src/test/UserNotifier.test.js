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

var sinon = require('sinon'),
    assert = require('chai').assert;
var UserNotifier = require('../lib/UserNotifier');

suite('UserNotifier', function() {

    suite('notify', function() {
        var sut, notificationControllerFake, event, userName, workgroupName;

        setup(function() {
            notificationControllerFake = {
                notifyUser: sinon.spy()
            };
            workgroupName = '1-workgroup';
            sut = new UserNotifier(notificationControllerFake);
            userName = 'testUser';
            event = 'create';
        });

        teardown(function() {
        });

        test('should call notificationController notifyUser to correct user using exchange', function() {
            sut.notify(event, userName, workgroupName);
            sinon.assert.calledOnce(notificationControllerFake.notifyUser);
            var useUserExchange = true;
            sinon.assert.calledWithExactly(notificationControllerFake.notifyUser, sinon.match.object, userName, useUserExchange);
        });

        test('should call notificationController notifyUser with correct notification', function() {
            sut.notify(event, userName, workgroupName);

            var notification = notificationControllerFake.notifyUser.firstCall.args[0];

            assert.equal(notification.type, 'filesystem');

            var notifData = notification.data;
            assert.isArray(notifData);
            assert.lengthOf(notifData, 1);

            var notifDataFirst = notifData[0];
            assert.isObject(notifDataFirst);
            assert.equal(notifDataFirst.from, 'system');
            assert.equal(notifDataFirst.name, 'modified');
            assert.equal(notifDataFirst.type, 'filesystem');
            assert.equal(notifDataFirst.data, "[{\"path\":\"workgroup:///" + workgroupName + "\",\"type\":\"users\",\"event\":\"" + event.toUpperCase() + "\",\"tenant\":\"eyeos\"}]");
        });

    });
});
