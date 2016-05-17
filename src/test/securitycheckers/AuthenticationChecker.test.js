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
var AuthenticationChecker = require('../../lib/securitycheckers/AuthenticationChecker');
var EyeosAuth = require('eyeos-auth');


suite('AuthenticationChecker', function(){
	var sut;
	var eyeosAuth, eyeosAuthMock;
	var req, res, next;
	var resMock;

	setup(function(){
		req = {};
		res = {send:function(){}};
		next = function(){};

		resMock = sinon.mock(res);

		eyeosAuth = new EyeosAuth();
		eyeosAuthMock = sinon.mock(eyeosAuth);

		sut = new AuthenticationChecker(eyeosAuth);
	});

	suite('check', function(){
		test('should call eyeosAuth verifyRequest with correct values', function(){
			var expVerifyRequest = eyeosAuthMock.expects('verifyRequest').once().withExactArgs(req);
			var actual = sut.check(req, res, next);
			expVerifyRequest.verify();
		});

		test('when eyeosAuth verifyRequest return false should call res.send with 401', function(){
			eyeosAuthMock.expects('verifyRequest').returns(false);
			var expSend = resMock.expects('send').once().withExactArgs(401);
			var actual = sut.check(req, res, next);
			expSend.verify();
		});

	});
});
