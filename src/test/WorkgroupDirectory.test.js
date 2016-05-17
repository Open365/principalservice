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
var PrincipalNameValidator = require('../lib/utils/PrincipalNameValidator');
var PrincipalServiceError = require('../lib/utils/PrincipalServiceError');
var path = require('path');

suite('WorkgroupDirectory', function(){
	var sut;
	var fakeFs, fsMock;
	var workgroupsDirectory, workgroupDirectory;
	var principalNameValidator;
	var workgroupName;
	var fakeRimraf, rimrafMock;
	var validName;

	setup(function(){
		principalNameValidator = new PrincipalNameValidator();

		workgroupName = 'testWorkgroup';
		req = {
			body: {name: workgroupName},
			path: '/api/workgroups/547d9959d1ff524744ee5422'
		};
		next = function(){};

		workgroupsDirectory = path.join(settings.mountPoint.path, 'workgroups');
		workgroupDirectory = path.join(workgroupsDirectory, workgroupName);

		fakeFs = {mkdirSync:function(){}};
		fsMock = sinon.mock(fakeFs);

		res = {
			status: function() {},
			send: function() {},
			end: function() {}
		};
		resMock = sinon.mock(res);

		fakeRimraf = {sync:function() {}};
		rimrafMock = sinon.mock(fakeRimraf);

		validName = 'newValidName';

		sut = new WorkgroupDirectory(fakeFs, principalNameValidator, fakeRimraf);
	});

	suite('create', function(){

		test('should call fs.mkdirSync with correct params', function(){
			var expMkdir = fsMock.expects('mkdirSync').once().withExactArgs(workgroupDirectory, '750');
			var actual = sut.create(workgroupName);
			expMkdir.verify();
		});

		test('when fs.mkdirSync doesnt throw error should return true', function(){
			var actual = sut.create(workgroupName);
			assert.isTrue(actual);
		});

		test('when fs.mkdirSync throw error EEXIST should throw ERR_WORKGROUP_EXISTS', function(){
			var error = new Error();
			error.code = 'EEXIST';
			fsMock.expects('mkdirSync').throws(error);
			var expected = new PrincipalServiceError(
				"Folder for workgroup '" + workgroupName + "' (" + workgroupDirectory + ") already exists",
				"ERR_WORKGROUP_EXISTS",
				{
					workgroupName: workgroupName
				},
				error
			);
			try {
				sut.create(workgroupName);
				assert.isFalse("Method should have thrown an exception and not reach this point");
			} catch (actual) {
				assert.deepEqual(actual, expected);
			}
		});

		test('when fs.mkdirSync throw error different than EEXIST should throw ERR_MKDIR_WORKGROUP', function(){
			var error = new Error();
			error.code = 'OTHER ERROR';
			fsMock.expects('mkdirSync').throws(error);
			var expected = new PrincipalServiceError(
				"Error creating folder for workgroup '" + workgroupName + "' (" + workgroupDirectory + ")",
				"ERR_MKDIR_WORKGROUP",
				{
					workgroupName: workgroupName
				},
				error
			);
			try {
				sut.create(workgroupName);
				assert.isFalse("Method should have thrown an exception and not reach this point");
			} catch (actual) {
				assert.deepEqual(actual, expected);
			}
		});

		test('should throw ERR_WORKGROUP_NAME_INVALID if invalid name', function() {
			sinon.stub(principalNameValidator, 'isNameValid', function() {
				return false;
			});
			var expected = new PrincipalServiceError(
				"Tried to create a workgroup (" + workgroupName + ") with invalid chars",
				"ERR_WORKGROUP_NAME_INVALID",
				{
					workgroupName: workgroupName
				}
			);
			try {
				sut.create(workgroupName);
				assert.isFalse("Method should have thrown an exception and not reach this point");
			} catch (actual) {
				assert.deepEqual(actual, expected);
			}
		});

	});

	suite('erase', function(){

		test('should call rimraf.sync with correct params', function(){
			var expSync = rimrafMock.expects('sync').once().withExactArgs(workgroupDirectory);
			var actual = sut.erase(workgroupName);
			expSync.verify();
		});

		test('when rimraf.sync doesnt throw error should return true', function(){
			var actual = sut.erase(workgroupName);
			assert.isTrue(actual);
		});

		test('when rimraf.sync throw error ENOENT should return ENOENT', function(){
			var error = new Error();
			error.code = 'ENOENT';
			rimrafMock.expects('sync').throws(error);
			var actual = sut.erase(workgroupName);
			assert.equal(actual, 'ENOENT');
		});

		test('when rimraf.sync throw error different than ENOENT should return ERROR', function(){
			var error = new Error();
			error.code = 'ANY';
			rimrafMock.expects('sync').throws(error);
			var actual = sut.erase(workgroupName);
			assert.equal(actual, 'ERROR');
		});
	});

	suite('update', function() {
		test('should return INVALID if invalid name', function() {
			sinon.stub(principalNameValidator, 'isNameValid', function() {
				return false;
			});
			var actual = sut.update(workgroupName);
			assert.equal(actual, 'INVALID');
		});
	});

	suite('createMainWorkgroupDir', function() {

		test('should call fs.mkdirSync with correct params', function(){
			var expMkdir = fsMock.expects('mkdirSync').once().withExactArgs(workgroupsDirectory, '750');
			var actual = sut._createMainWorkgroupDir();
			expMkdir.verify();
		});

	});
});
