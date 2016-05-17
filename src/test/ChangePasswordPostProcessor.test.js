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

var ChangePasswordPostProcessor = require('../lib/ChangePasswordPostProcessor');

suite('#ChangePasswordPostProcessor', function() {
	var sut;
	var consumeService;

	setup(function() {
		consumeService = {
			post: sinon.stub().callsArg(4)
		};
		sut = new ChangePasswordPostProcessor(null, consumeService);
	});

	test.skip('Should call consumeService with the correct arguments', function(done) {
		var userData = {
			username: 'user',
			oldPassword: 'oldPass',
			newPassword: 'newPass',
			card: {'some': 'card'}
		};
		sut.process(userData, function() {
			sinon.assert.calledWith(consumeService.post, sinon.match.string, sinon.match.object, sinon.match(function(obj) {
				obj = JSON.parse(obj);
				return obj.username === 'user' && obj.oldPassword !== 'oldPass' && obj.newPassword !== 'newPass';
			}));
			done();
		});
	});
});
