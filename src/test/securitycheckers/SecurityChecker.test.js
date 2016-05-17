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
var SecurityChecker = require('../../lib/securitycheckers/SecurityChecker');
var EyeosAuth = require('eyeos-auth');


suite('SecurityChecker', function(){
	var sut;
	var eyeosAuth, eyeosAuthMock;
	var request, groupId;

	setup(function(){
		request = {};
		groupId = '54788c160a7532e8561fa90a';

		eyeosAuth = new EyeosAuth();
		eyeosAuthMock = sinon.mock(eyeosAuth);

		sut = new SecurityChecker(eyeosAuth);
	});

	suite('isAdmin', function(){

		test('should call eyeosAuth hasPermission with correct values', function(){
			var expectedPermission = 'eyeos.group.' + groupId + '.administrator';
			var expHasPermission = eyeosAuthMock.expects('hasPermission').once().withExactArgs(request, expectedPermission);
			var actual = sut.isAdmin(request, groupId);
			expHasPermission.verify();
		});

		test('when eyeosAuth hasPermission return false should return false', function(){
			eyeosAuthMock.expects('hasPermission').returns(false);
			var actual = sut.isAdmin(request, groupId);
			assert.isFalse(actual);
		});

		test('when eyeosAuth hasPermission return true should return true', function(){
			eyeosAuthMock.expects('hasPermission').returns(true);
			var actual = sut.isAdmin(request, groupId);
			assert.isTrue(actual);
		});
	});
});
