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
var MembershipProviderExpressAdapter = require('../lib/MembershipProviderExpressAdapter');

suite('MembershipProviderExpressAdapter', function () {
	var sut;

	var req;
	var res;
	var next;

	setup(function () {
		req = {
			headers: {
				card: '{"username":"fake username"}'
			}
		};

		res = {
			send: function () {
			},
			status: function () {
			},
			json: function () {
			}
		};

		next = sinon.stub();

		sut = new MembershipProviderExpressAdapter();
	});

	suite('#removeCurrentUserFromBody', function () {
		var body, currentUser;

		setup(function () {
			currentUser = 'fake username';
			body = [{memberId:'user1'}, {memberId: currentUser}];
			req.body = body;
		});

		function exercise () {
			return sut.removeCurrentUserFromBody(req, res, next);
		}

		test('when current user exist in body should remove it', function () {
			var expectedBody = [{memberId:'user1'}];
			exercise();
			assert.deepEqual(body, expectedBody);
		});

		test('when there are elements in the body should call next', sinon.test(function(){
			exercise();
			assert.isTrue(next.called);
		}));

		test('when there there are not elements in the body should call res.send', sinon.test(function(){
			req.body = [];
			this.mock(res)
				.expects('send')
				.once()
				.withExactArgs(200);

			exercise();
		}));

	});
});
