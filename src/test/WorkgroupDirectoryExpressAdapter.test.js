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
var settings = require('../lib/settings.js');
var WorkgroupDirectory = require('../lib/WorkgroupDirectory');
var WorkgroupDirectoryExpressAdapter = require('../lib/WorkgroupDirectoryExpressAdapter');
var PrincipalServiceError = require('../lib/utils/PrincipalServiceError');

suite('WorkgroupDirectoryExpressAdapter', function(){
	var sut;
	var fakeFs;
	var req, res, next;
	var resMock;
	var workgroupName;
	var fakeWaitFor, waitForMock;
	var workgroupDirectory, workgroupDirectoryMock;

	setup(function(){

		workgroupName = 'testWorkgroup';
		req = {
			body: {name: workgroupName},
			path: '/api/workgroups/547d9959d1ff524744ee5422'
		};
		next = function(){};

		res = {
			status: function() {},
			send: function() {},
			end: function() {}
		};
		resMock = sinon.mock(res);

		fakeWaitFor = {forMethod: function() {}};
		waitForMock = sinon.mock(fakeWaitFor);

		// WorkgroupDirectory has logic in its constructor!
		// we need to pass it a fakeFS so it really does not anything
		fakeFs = {
			mkdirSync: function () {
			}
		};
		workgroupDirectory = new WorkgroupDirectory(fakeFs);
		workgroupDirectoryMock = sinon.mock(workgroupDirectory);

		sut = new WorkgroupDirectoryExpressAdapter(fakeWaitFor, workgroupDirectory);
	});

	suite('create', function () {
		var publicInfo = "public info";
		var publicCleanedInfo = "public cleaned info";
		var workgroupDirectory_create_stub;

		setup(function () {
			workgroupDirectory_create_stub = sinon.stub(workgroupDirectory, 'create');
		});

		function exercise () {
			return sut.create(req, res, next);
		}

		function prepareAndThrowError(errorCode) {
			var error = new PrincipalServiceError(
				"fake error message",
				errorCode,
				"fake data",
				"fake previous"
			);
			workgroupDirectory_create_stub.throws(error);
			sinon.stub(error, 'getPublicInfo')
				// stub returns publicInfo if called with false (not internal error)
				.withArgs(false)
				.returns(publicInfo)

				// or returns the cleaned info if called with true (internal error)
				.withArgs(true)
				.returns(publicCleanedInfo);
			return error;
		}

		var exceptionData = [
			{
				code: "ERR_WORKGROUP_EXISTS",
				expectedStatus: 400,
				expectedInfo: publicInfo
			},
			{
				code: "ERR_WORKGROUP_NAME_INVALID",
				expectedStatus: 400,
				expectedInfo: publicInfo
			},
			{
				code: "ERR_MKDIR_WORKGROUP",
				expectedStatus: 500,
				expectedInfo: publicCleanedInfo
			}
		];

		test('when workgroupDirectory.create return true should call next', function(){
			workgroupDirectory_create_stub.returns(true);
			var called = false;
			next = function(){
				called = true;
			};
			exercise();
			assert.isTrue(called);
		});

		for (var i = 0; i < exceptionData.length; i++) {
			var icode = exceptionData[i].code;
			var istatus = exceptionData[i].expectedStatus;
			var iinfo = exceptionData[i].expectedInfo;
			test('When the model throws an error of type ' + icode + ' call res.status(' + istatus + ')', function () {
				prepareAndThrowError(icode)
				var res_statusStub = sinon.stub(res, 'status');
				exercise();
				assert.deepEqual(res_statusStub.args[0], [istatus]);
			});

			test('when the model throws an error of type ' + icode + ' call res.send() with ' + iinfo, function () {
				prepareAndThrowError(icode)
				var res_sendStub = sinon.stub(res, 'send');
				exercise();
				assert.deepEqual(res_sendStub.args[0], [iinfo]);
			});
		}

		test('when the model throws an error of different type that the ones handled, rethrow the error', function () {
			var expectedThrownError = prepareAndThrowError("WHATEVER OTHER FAKE ERROR");
			try {
				exercise();
				assert.isFalse("Should have thrown an exception... fix this test.")
			} catch (actualError) {
				assert.deepEqual(actualError, expectedThrownError);
			};
		});
	});

	suite('erase', function(){

		test('when workgroupDirectory.erase return true should call next', function(){
			workgroupDirectoryMock.expects('erase').once().returns(true);
			waitForMock.expects('forMethod').returns({name: workgroupName});
			var called = false;
			next = function(){
				called = true;
			};
			sut.erase(req, res, next);
			assert.isTrue(called);
		});

		test('when workgroupDirectory.erase return ENOENT should call res.send with 400', function(){
			workgroupDirectoryMock.expects('erase').once().returns('ENOENT');
			waitForMock.expects('forMethod').returns({name: workgroupName});
			var expecSend = resMock.expects('send').once().withExactArgs(400);
			sut.erase(req, res, next);
			expecSend.verify();
		});

		test('when workgroupDirectory.erase return error different than ENOENT should call res.send with 500', function(){
			workgroupDirectoryMock.expects('erase').once().returns('ERROR');
			waitForMock.expects('forMethod').returns({name: workgroupName});
			var expecSend = resMock.expects('send').once().withExactArgs(500);
			sut.erase(req, res, next);
			expecSend.verify();
		});
	});

	suite('update', function() {

		test('should call res.send with 400 if no name', function () {
			var resMock = sinon.mock(res);
			var exp = resMock.expects('status')
				.once()
				.withExactArgs(400);
			sut.update({body:{}}, res, next);
			exp.verify();
		});

		test('should call res.end with right message if no name', function () {
			var resMock = sinon.mock(res);
			var exp = resMock.expects('end')
				.once()
				.withExactArgs('No workgroup name provided.');
			sut.update({body:{}}, res, next);
			exp.verify();
		});

		test('should call res.send with 400 if workgroupDirectory.update return INVALID', function() {
			workgroupDirectoryMock.expects('update').once().returns('INVALID');
			var resMock = sinon.mock(res);
			var exp = resMock.expects('status')
				.once()
				.withExactArgs(400);
			sut.update(req, res, next);
			exp.verify();
		});

		test('should call res.end with right message if workgroupDirectory.update return INVALID', function() {
			workgroupDirectoryMock.expects('update').once().returns('INVALID');
			var resMock = sinon.mock(res);
			var exp = resMock.expects('end')
				.once()
				.withExactArgs('The name \"'+ workgroupName + '\" is not valid. Please choose a different name.');
			sut.update(req, res, next);
			exp.verify();
		});
	});

});
