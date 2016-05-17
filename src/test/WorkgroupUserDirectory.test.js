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

var path = require('path');
var sinon = require('sinon');
var assert = require('chai').assert;
var WorkgroupUserDirectoryBaseDir = require('../lib/WorkgroupUserDirectoryBaseDir');
var WorkgroupUserDirectory = require('../lib/WorkgroupUserDirectory');

suite('WorkgroupUserDirectory', function(){
	var sut;
	var mkdirpWrapper;
	var mkdirpStub;
	var usersDir;
	var workgroupName;
	var userName;
	var workgroupUserDirectoryBaseDir;
	var waitfor;
	var fakeRimraf;
	var userNotifier = {notify:function() {}};

	setup(function(){
		usersDir = 'a fake users dir';
		workgroupName = 'testWorkgroup';
		userName = 'perico';
		mkdirpWrapper = {
			mkdirp: function () {
			}
		};
		mkdirpStub = sinon.stub(mkdirpWrapper, 'mkdirp');

		waitfor = {
			for: function () {
			}
		};

		fakeRimraf = {sync:function() {}};

		sinon.stub(waitfor, 'for', function () {
			return arguments[0].apply({}, Array.prototype.slice.call(arguments, 1));
		});

		workgroupUserDirectoryBaseDir = new WorkgroupUserDirectoryBaseDir();

		sut = new WorkgroupUserDirectory(waitfor, workgroupUserDirectoryBaseDir, mkdirpStub, fakeRimraf, usersDir, userNotifier);
	});

	suite('create', function() {
		var userWorkgroupDirectory, userNotifierMock;
		var wgudbdstub;

		setup(function () {
			userNotifierMock = sinon.mock(userNotifier);
			wgudbdstub = sinon.stub(workgroupUserDirectoryBaseDir, 'ensureBaseUserWorkgroupDirExist');
			userWorkgroupDirectory = path.join(usersDir, userName, '/workgroups/', workgroupName);
		});

		teardown(function() {
			userNotifierMock.restore();
		});

		function exercise () {
			return sut.create(userName, workgroupName);
		}

		test('should call mkdirp with correct params', function () {
			exercise();
			assert.deepEqual(mkdirpStub.args[0], [userWorkgroupDirectory, '750']);
		});

		test('if everything correct then should return true', function(){
			var actual = exercise();
			assert.isTrue(actual);
		});

		test('if everything correct then should call userNotifier notify', function() {
			var expectation = userNotifierMock.expects('notify')
				.once().withExactArgs('create', userName, workgroupName);
			exercise();
			expectation.verify();
		});

		//test('when userWorkgroupDirectory already exists should return "EEXIST"', function(){
		//	mkdirpStub.returns(null);
		//	var actual = exercise();
		//	assert.equal(actual, 'EEXIST')
		//});

		test('when mkdir throws then should return ERROR', function(){
			mkdirpStub.throws({code: 'AN ERROR'});
			var actual = exercise();
			assert.equal(actual, 'ERROR');
		});

		test('when workgroupsUserDirectoryBaseDir.ensureBaseUserWorkgroupDirExist throws, then return "ERROR"', function () {
			wgudbdstub.throws({code: 'An ERROR'});
			var actual = exercise();
			assert.equal(actual, 'ERROR');
		});
	});

	suite('erase', function () {
		function exercise () {
			return sut.erase(userName, workgroupName);
		}

		test('should call rimraf.sync with correct params', sinon.test(function(){
			var rimrafStub = this.stub(fakeRimraf, 'sync');
			exercise();
			var expectedDir = path.join(usersDir, userName, 'workgroups', workgroupName);
			assert.isTrue(rimrafStub.calledWith(expectedDir));
		}));

		test('when rimraf.sync doesnt throw error should return true', function(){
			var actual = exercise();
			assert.isTrue(actual);
		});

		test('when rimraf.sync doesnt throw error should call userNotifier notify', function() {
			var expectation = sinon.mock(userNotifier).expects('notify')
				.once().withExactArgs('delete', userName, workgroupName);
			exercise();
			expectation.verify();
		});

		test('when rimraf.sync throws error should return false', sinon.test(function(){
			var error = {
				code: 'ANY'
			};
			this.stub(fakeRimraf, 'sync').throws(error);
			var actual = exercise();
			assert.isFalse(actual);
		}));

	});

});
