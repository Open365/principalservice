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
var ChangePasswordExpressAdapter = require('../lib/ChangePasswordExpressAdapter');
var ChangePasswordProvider = require('../lib/ChangePasswordProvider');
var ChangePasswordPostProcessor = require('../lib/ChangePasswordPostProcessor');

suite('ChangePasswordExpressAdapter', function () {
	var sut;

	var req;
	var res;
	var next;
	var provider, providerStub, postProcessor;
	var username, currentPass, newPass, card;

	setup(function () {
		provider = new ChangePasswordProvider();
		postProcessor = sinon.stub(new ChangePasswordPostProcessor());
		username = "fake username";
		currentPass = 'fakeCurrentPass';
		newPass = 'fakeNewPass';


		card = {username: username, domain:'myDomain'};
        req = {
			headers: {
				card: JSON.stringify(card)
			},
			body:{
				currentpass: currentPass,
				newpass: newPass
			}
		};

		res = {
			send: function () {
			},
			sendStatus: sinon.stub(),
			status: function () {
			},
			json: function () {
			}
		};

		next = sinon.stub();

		providerStub = sinon.stub(provider, 'changePassword');

		sut = new ChangePasswordExpressAdapter(provider, postProcessor);
	});

	suite('#changePassword', function () {
		test("calls to changePasswordProvider.changePassword", function () {
			sut.changePassword(req, res, next);
			var expected = {
				"username": username,
				"card": card,
				"currentpassword": currentPass,
				"newpassword": newPass,
				"domain": card.domain
			};

			sinon.assert.calledWithExactly(providerStub, expected, sinon.match.func);
		});

		test("doesn't call changePassword when missing current password", function () {
			delete req.body.currentpass;
			sut.changePassword(req, res, next);
			sinon.assert.notCalled(providerStub);

		});

		test("doesn't call changePassword when missing new password", function () {
			delete req.body.newpass;
			sut.changePassword(req, res, next);
			sinon.assert.notCalled(providerStub);

		});

		test("responses error code 400 when missing any password", function () {
			delete req.body.currentpass;
			sut.changePassword(req, res, next);
			sinon.assert.calledWithExactly(res.sendStatus, 400);

		});

	});

	suite("#changePassword", function () {
		test("responses the code provided", function () {
			providerStub.callsArgWith(1, 200);
			sut.changePassword(req, res, next);
			sinon.assert.calledWithExactly(res.sendStatus, 200);
		});

	});
});
