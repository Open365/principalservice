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
var ChangePasswordProvider = require('../lib/ChangePasswordProvider');
var eyeos_principal = require('eyeos-principal');
var mongoose = require('mongoose');
var settings = require('../lib/settings');

suite('ChangePasswordProvider', function () {
	var sut;
	var principalModel, principalModelFindOneAndUpdate, ldapClient,ldapClientStubBind,ldapClientStubModify,ldapClientStubUnbind;

	setup(function () {
		ldapClient = {
			bind: function () {
			},
			unbind: function () {},
			modify: function () {}
		};

		ldapClientStubBind = sinon.stub(ldapClient, 'bind');
		ldapClientStubModify = sinon.stub(ldapClient, 'modify');
		ldapClientStubUnbind = sinon.stub(ldapClient, 'unbind');
		var PrincipalSchema = eyeos_principal.PrincipalSchema(mongoose);
		principalModel =  PrincipalSchema.getModel();

		principalModelFindOneAndUpdate = sinon.stub(principalModel, 'findOneAndUpdate');

		sut = new ChangePasswordProvider(ldapClient, principalModel);
	});

	teardown(function() {
		principalModelFindOneAndUpdate.restore();
	});

	suite('#changePassword', function () {
		var data;
		setup(function () {
			data = {
				username: 'fakeuser',
				currentpassword: 'fakepassword',
				domain: 'fakedomain'
			};
		});
		function exercise (data, cb) {
			sut.changePassword(data, cb);
		}

		test("Binds ldap with provided username and password", function () {
			var expected = 'cn='+ data.username + '@' + data.domain +',ou=People, dc=eyeos,dc=com';
			exercise(data, sinon.stub());
			sinon.assert.calledWithExactly(ldapClientStubBind, expected, data.currentpassword, sinon.match.func);
		});

		test("LDAP unbind is called if an error occurs binding user", function () {
			var cb = sinon.stub();
			ldapClientStubBind.callsArgWith(2, { code: 1 });
			exercise(data, cb);
			sinon.assert.calledOnce(ldapClientStubUnbind);
		});

		test("returns 401 if credentials are wrong", function () {
			var data = {
				username: 'fakeuser',
				currentpassword: 'fakepassword'
			};
			var cb = sinon.stub();
			ldapClientStubBind.callsArgWith(2, { code: 49 });
			exercise(data, cb);
			sinon.assert.calledWithExactly(cb, 401, "Current password doesn't match");
		});

		test("returns 500 if some error is produced", function () {
			var data = {
				username: 'fakeuser',
				currentpassword: 'fakepassword'
			};
			var err = { code: 1, message: '' };
			var cb = sinon.stub();
			ldapClientStubBind.callsArgWith(2, err);
			exercise(data, cb);
			sinon.assert.calledWithExactly(cb, 500, sinon.match.string);
		});

		test("returns 400 if new password doesn't complies with the rules", function () {
			var data = {
				username: 'fakeuser',
				currentpassword: 'fakepassword',
				newpassword: '12345'
			};
			var cb = sinon.stub();
			ldapClientStubBind.callsArgWith(2, null);
			exercise(data, cb);
			sinon.assert.calledWithExactly(cb, 400, sinon.match.string);
		});

		test("returns 400 if new password is the same as the username", function () {
			var data = {
				username: 'fakeuser',
				currentpassword: 'fakepassword',
				newpassword: 'fakeuser'
			};
			var cb = sinon.stub();
			ldapClientStubBind.callsArgWith(2, null);
			exercise(data, cb);
			sinon.assert.calledWithExactly(cb, 400, sinon.match.string);
		});


		test("LDAP unbind is called if modify is called", function () {
			var data = {
				username: 'fakeuser',
				currentpassword: 'fakepassword',
				newpassword: 'Aa123456'
			};
			var cb = sinon.stub();
			ldapClientStubBind.callsArgWith(2, null);
			ldapClientStubModify.callsArgWith(2, null);
			exercise(data, cb);
			sinon.assert.calledOnce(ldapClientStubUnbind);
		});

		test("returns 401 if user doesn't have permissions to change password", function () {
			var data = {
				username: 'fakeuser',
				currentpassword: 'fakepassword',
				newpassword: 'Aa123456'
			};
			var err = { code: 50, message: '' };

			var cb = sinon.stub();
			ldapClientStubBind.callsArgWith(2, null);
			ldapClientStubModify.callsArgWith(2, err);
			exercise(data, cb);
			sinon.assert.calledWithExactly(cb, 401, sinon.match.string);
		});


		test("returns 500 if some error occurs modifying the password", function () {
			var data = {
				username: 'fakeuser',
				currentpassword: 'fakepassword',
				newpassword: 'Aa123456'
			};
			var err = { code: 1, message: '' };

			var cb = sinon.stub();
			ldapClientStubBind.callsArgWith(2, null);
			ldapClientStubModify.callsArgWith(2, err);
			exercise(data, cb);
			sinon.assert.calledWithExactly(cb, 500, sinon.match.string);
		});

		test("returns 200 if password is modified correctly", function () {
			var data = {
				username: 'fakeuser',
				currentpassword: 'fakepassword',
				newpassword: '12345678'
			};

			var cb = sinon.stub();
			ldapClientStubBind.callsArgWith(2, null);
			ldapClientStubModify.callsArgWith(2, null);
			principalModelFindOneAndUpdate.callsArgWith(2, null);
			exercise(data, cb);
			sinon.assert.calledWithExactly(cb, 200, sinon.match.string);
		});

	});

});
