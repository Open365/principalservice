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
var PrincipalsProviderExpressAdapter = require('../lib/PrincipalsProviderExpressAdapter');
var PrincipalsProvider = require('../lib/PrincipalsProvider');

suite('PrincipalsProviderExpressAdapter', function(){
	var sut;
	var req, res, next;
	var principalsProvider, principalsProviderPutStub;
	var username, domain;

	setup(function(){
		var writableFields = "foo bar";

		username = "fake username";
		domain = "fake domain";

		req = {
			headers: {
				card: '{"username":"' + username + '","domain":"' + domain + '"}'
			},
			body: {
				"foo": "bar",
				"bar": "foo"
			}
		};

		res = {
			send: sinon.stub(),
			status: sinon.stub(),
			json: sinon.stub()
		};

		res.status.returns(res);

		next = sinon.stub();

		principalsProvider = new PrincipalsProvider();
		principalsProviderPutStub = sinon.stub(principalsProvider, 'put');

		sut = new PrincipalsProviderExpressAdapter(principalsProvider, writableFields);
	});

	suite('#putMe', function () {

		function exercise () {
			return sut.putMe(req, res, next);
		}

		test('should save the data to the principal that sent the message', function(){
			exercise();
			sinon.assert.calledWithExactly(principalsProviderPutStub, username, domain, req.body, sinon.match.func);
		});

		test('should send error when error is returned from put', function () {
			var err = new Error();
			exercise();
			principalsProviderPutStub.callArgWith(3, err);
			sinon.assert.calledWithExactly(res.status, 500);
		});

		test('should send the data when all ok', function () {
			var data = {"foo2": "bar2"};
			var err;
			exercise();
			principalsProviderPutStub.callArgWith(3, err, data);
			sinon.assert.calledWithExactly(res.status, 200);
			sinon.assert.calledWithExactly(res.send, data);
		});

		test('should send error when modifying a read only field', function () {
			req.body = {'fux': 'bax'};
			exercise();
			sinon.assert.calledWithExactly(res.status, 403);
		});
	});

});
