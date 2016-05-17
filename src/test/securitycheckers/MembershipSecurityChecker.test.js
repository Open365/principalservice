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
var expect = require('chai').expect;
var MembershipSecurityChecker = require('../../lib/securitycheckers/MembershipSecurityChecker');
var SecurityChecker = require('../../lib/securitycheckers/SecurityChecker');


suite('MembershipSecurityChecker', function ()
{
    var sut;
    var securityChecker, securityCheckerMock;
    var req, res, next;
    var resMock;

    setup(function ()
    {
        req = {
            body: {groupId: '54789b12e7c3a8125aa63000'},
            path: '/54789b12e7c3a8125aa63000',
            query: {
                conditions: '{"$and":[{"groupId":"54789b12e7c3a8125aa63000"},{"memberId":{"$in":["dani.ametller","jordi.nistal"]}}]}'
            }
        };
        res = {send: function ()
        {
        }};
        next = function ()
        {
        };

        resMock = sinon.mock(res);

        securityChecker = new SecurityChecker();
        securityCheckerMock = sinon.mock(securityChecker);

        sut = new MembershipSecurityChecker(securityChecker);
    });

    function exerciseCheck()
    {
        sut.check(req, res, next);
    }

    suite('check', function ()
    {

        function expectSendWhenIsAdminFalse()
        {
            securityCheckerMock.expects('isAdmin').returns(false);
            var expSend = resMock.expects('send').once().withExactArgs(403);
            exerciseCheck();
            expSend.verify();
        };

        function expectNextWhenIsAdminTrue()
        {
            var called = false;
            next = function ()
            {
                called = true;
            };
            securityCheckerMock.expects('isAdmin').returns(true);
            exerciseCheck();
            assert.isTrue(called);
        };

        test('when securityChecker isAdmin and method is POST return false should call res.send with 403', function ()
        {
            req.method = 'POST';
            expectSendWhenIsAdminFalse();
        });

        test('when securityChecker isAdmin and method is DELETE return false should call res.send with 403', function ()
        {
            req.method = 'DELETE';
            expectSendWhenIsAdminFalse();
        });

        test('when securityChecker isAdmin and method is POST return true should call next', function ()
        {
            req.method = 'POST';
            expectNextWhenIsAdminTrue();
        });

        test('when securityChecker isAdmin and method is DELETE return true should call next', function ()
        {
            req.method = 'DELETE';
            expectNextWhenIsAdminTrue();
        });
        
    });
});
