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
var WorkgroupUserDirectory = require('../lib/WorkgroupUserDirectory');
var WorkgroupUserDirectoryExpressAdapter = require('../lib/WorkgroupUserDirectoryExpressAdapter');

suite('WorkgroupUserDirectoryExpressAdapter', function(){
	var sut;
	var req, res, next;
	var resMock;
	var fakeWaitFor, waitForStub;
	var workgroupName;
	var username;
	var workgroupUserDirectoryEraser;
	var timesNextIsCalled;

	setup(function(){
		workgroupName = 'testWorkgroup';
		username = 'a fake username';
		req = {
			path: '/api/membership/547d9959d1ff524744ee5422',
			query: {
				conditions: '{"$and":[{"groupId":"54789b12e7c3a8125aa63000"},{"memberId":{"$in":["dani.ametller","jordi.nistal"]}}]}'
			}
		};
		timesNextIsCalled = 0;
		next = function () {
			timesNextIsCalled++;
		};

		var workgroup = {name: workgroupName};
		var membership = {groupId: '547d9959d1ff524744ee5422', memberId: username};

		workgroupUserDirectory = new WorkgroupUserDirectory();
		res = {send: function(){}};
		resMock = sinon.mock(res);

		fakeWaitFor = {forMethod: function() {}};
		waitForStub = sinon.stub(fakeWaitFor, 'forMethod');
		waitForStub
			.onCall(0).returns(membership)
			.onCall(1).returns(workgroup);


		sut = new WorkgroupUserDirectoryExpressAdapter(workgroupUserDirectory, fakeWaitFor);
	});

	suite('erase', function(){
		function exercise () {
			return sut.erase(req, res, next);
		}

		test('when the workgroup does not exist calls res.send(500)', function () {
			waitForStub
				.onCall(0)
				.throws('whatever');
			var exp = resMock
				.expects('send')
				.once()
				.withExactArgs(500);
			exercise();
			exp.verify();
		});

		test('when workgroupUserDirectory.erase returns true then should call next()', function () {
			sinon.stub(workgroupUserDirectory, 'erase').returns(true);
			exercise();
			assert.equal(timesNextIsCalled, 1);
		});

		test('when workgroupUserDirectory.erase returns false then should call res.send(500)', function () {
			sinon.stub(workgroupUserDirectory, 'erase').returns(false);
			var exp = resMock
				.expects('send')
				.once()
				.withExactArgs(500);
			exercise();
			exp.verify();
		});

	});
});
