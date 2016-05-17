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
var EyeosAuth = require('eyeos-auth');
var ManageProfilePermissionChecker = require('../../lib/securitycheckers/ManageProfilePermissionChecker');


suite('ManageProfilePermissionChecker', function(){
	var sut;
	var eyeosAuth, eyeosAuthStub;
	var req, res, next;

	setup(function(){
		req = {};
		res = {send:function(){}};
		next = sinon.stub();

		eyeosAuth = new EyeosAuth();
		eyeosAuthStub = sinon.stub(eyeosAuth);

		sut = new ManageProfilePermissionChecker(eyeosAuth);
	});

	suite('check', function(){
		function exercise() {
			sut.check(req, res, next);
		}

		test('should call eyeosAuth hasPermission with correct values', function(){
			exercise();
			sinon.assert.calledWithExactly(eyeosAuthStub.hasPermission, req, ManageProfilePermissionChecker.MANAGE_PROFILE_PERMISSION);
		});

		test('when has permission to manage profiles should call next', sinon.test(function(){
			eyeosAuthStub.hasPermission.returns(true);
			exercise();
			sinon.assert.calledWithExactly(next);
		}));

		test(" when there's not permission to manage profiles should call next with an Error", sinon.test(function(){
			eyeosAuthStub.hasPermission.returns(false);
			exercise();
			sinon.assert.calledWithExactly(
				next,
				new Error("It is forbidden to GET, POST, PUT or DELETE anything without eyeos.admin.profiles.edit permission")
			);
		}));

	});
});
