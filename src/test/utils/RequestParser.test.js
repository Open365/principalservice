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

var sinon = require('sinon'),
	assert = require('chai').assert,
	RequestParser = require('../../lib/utils/RequestParser');

suite('RequestParser', function(){
	var sut;

	setup(function(){
		sut = new RequestParser();
	});

	suite('#extractUserIdFromHeaders', function() {
		var request, headers, card,
			expUsername, username;

		setup(function () {
			username = 'aUsername';
			card = {
				username: username
			};
			headers = {
				card: JSON.stringify(card)
			};
			request = {
				headers: headers
			};
		});

		function exercise () {
			return sut.extractUserIdFromHeaders(request);
		}

		test('when request headers are correct should return username', sinon.test(function(){
			expUsername = exercise();
			assert.equal(expUsername, username);
		}));

		test('when no request is passed should throw an exception', sinon.test(function () {
			request = null;
			assert.throw(exercise, 'No request given');
		}));

		test('when malformed or inexistent card should throw an exception', sinon.test(function () {
			headers.card = null;
			assert.throw(exercise, "No card found in request headers: {\"card\":null}");
		}));


	});
});
