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
var PermissionsServiceProvider = require('../lib/PermissionsServiceProvider');
var Client = require('eyeos-consume-service').Client;

suite('PermissionsServiceProvider', function () {
	var sut;
	var client, clientMock;
	var permissions;
	var userCard, signature, url, userName, headers, body;


	setup(function () {
		client = new Client();
		clientMock = sinon.mock(client);
		userName = 'user1';
		userCard = '{"username":"' + userName + '","expiration":23564}';
		signature = '9s5h9s65h9s5gh9sfg9h6dfv0b67sf7gb6hsgfsdhsdf==';
		headers = {
			card: userCard,
			signature: signature
		};
	});


	suite('test', function () {

		setup(function () {
			url = 'amqp.exchange://permissions/v1/users/';
			var settings = {url: url};
			permissions = ['eyeos.group.547c813627e862d730c9bc4e.administrator', 'eyeos.group.547885e97cc2a60056bceddc.administrator'];
			body = {
				permissions: permissions
			};

			sut = new PermissionsServiceProvider(client, settings);
		});

		test('addPermissions when called with should call client.put', function () {
			var clientPutExpectation = clientMock.expects('put')
				.once().withExactArgs(url + userName + '/permissions', headers, body);
			sut.addPermissions(permissions, userCard, signature);
			clientPutExpectation.verify();
		});

		test('removePermissions when called with should call client.delete', function () {
			var clientDeleteExpectation = clientMock.expects('delete')
				.once().withExactArgs(url + userName + '/permissions', headers, body);
			sut.removePermissions(permissions, userCard, signature);
			clientDeleteExpectation.verify();
		});

	});

});
