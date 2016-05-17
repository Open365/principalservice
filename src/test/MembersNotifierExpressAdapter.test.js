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
var MembersNotifierExpressAdapter = require('../lib/MembersNotifierExpressAdapter');

suite('MembersNotifierExpressAdapter', function(){
    var sut;
    var membersNotifier, membersNotifierSpy;
    var memberId1 = 'dani.ametller', memberId2 = 'dani.ametller', workgroupId = '54ad1a264142906534017738';
    var req, res, next;

    setup(function(){
        req = {
            path: '/api/membership/547d9959d1ff524744ee5422',
            query: {
                conditions: '{"$and":[{"groupId":"' + workgroupId + '"},{"memberId":{"$in":["' + memberId1 + '","' + memberId2 + '"]}}]}'
            }
        };
        res = {};
        next = {};

        membersNotifier = {userRemovedFromWorkgroup: function() {}};
    });

    test('userRemovedFromWorkgroup should call MembersNotifier userRemovedFromWorkgroup with correct params', function () {
        membersNotifierSpy = sinon.spy(membersNotifier, 'userRemovedFromWorkgroup');
        sut = new MembersNotifierExpressAdapter(membersNotifier);
        sut.userRemovedFromWorkgroup(req, res, next);

        assert.equal(memberId1, membersNotifierSpy.getCall(0).args[0]);
        assert.equal(workgroupId, membersNotifierSpy.getCall(0).args[1]);
        assert.equal(memberId2, membersNotifierSpy.getCall(1).args[0]);
        assert.equal(workgroupId, membersNotifierSpy.getCall(1).args[1]);
    });

});
