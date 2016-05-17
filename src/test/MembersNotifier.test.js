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

var sinon = require('sinon');
var assert = require('chai').assert;
var MembersNotifier = require('../lib/MembersNotifier');

suite('MembersNotifier', function(){
    var sut;
    var notificationControllerFake;
    var memberId = 'dani.ametller', workgroupId = '54ad1a264142906534017738';

    setup(function(){
        notificationControllerFake = {
            notifyUser: sinon.spy()
        };

        sut = new MembersNotifier(notificationControllerFake);
    });

    test('workgroupDeleted should call notificationsController.notifyUser using user exchange', function () {
        var useUserExchange = true;

        sut.workgroupDeleted(memberId, workgroupId);

        sinon.assert.calledOnce(notificationControllerFake.notifyUser);
        sinon.assert.calledWithExactly(notificationControllerFake.notifyUser, sinon.match.object, memberId, useUserExchange);
    });

    test('workgroupDeleted should call notificationsController.notifyUser with correct notification', function () {

        sut.workgroupDeleted(memberId, workgroupId);

        sinon.assert.calledOnce(notificationControllerFake.notifyUser);

        var notification = notificationControllerFake.notifyUser.firstCall.args[0];

        assert.equal(notification.type, 'workgroupDeleted');
        assert.equal(notification.data.workgroupId, workgroupId);

    });

    test('userRemovedFromWorkgroup should call send with correct params', function () {
        var useUserExchange = true;

        var msg = {
            type: 'userRemovedFromWorkgroup',
            data: {
                workgroupId: workgroupId
            }
        };

        sut.userRemovedFromWorkgroup(memberId, workgroupId);

        sinon.assert.calledOnce(notificationControllerFake.notifyUser);
        sinon.assert.calledWithExactly(notificationControllerFake.notifyUser, sinon.match.object, memberId, useUserExchange);

    });

    test('userRemovedFromWorkgroup should call notificationsController.notifyUser with correct notification', function () {
        sut.userRemovedFromWorkgroup(memberId, workgroupId);

        sinon.assert.calledOnce(notificationControllerFake.notifyUser);

        var notification = notificationControllerFake.notifyUser.firstCall.args[0];

        assert.equal(notification.type, 'userRemovedFromWorkgroup');
        assert.equal(notification.data.workgroupId, workgroupId);

    });
});
