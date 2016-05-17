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
var PrincipalsProvider = require('../lib/PrincipalsProvider');
var eyeos_principal = require('eyeos-principal');
var mongoose = require('mongoose');

suite('PrincipalsProviderExpressAdapter', function(){
	var sut;
	var principalId, domain, data, cb;
	var principalModel, principalModelFindOne;
	var principalItem, principalItemSaveStub;

	setup(function(){
		principalId = "fakeID";
		domain = "fakeDomain";
		data = {
			"foo": "bar"
		};
		cb = sinon.stub();

		var PrincipalSchema = eyeos_principal.PrincipalSchema(mongoose);
		principalModel = PrincipalSchema.getModel();
		principalModelFindOne = sinon.stub(principalModel, 'findOne');

		principalItem = new principalModel();
		principalItemSaveStub = sinon.stub(principalItem, 'save');

		sut = new PrincipalsProvider(principalModel);
	});

	teardown(function () {
		principalModelFindOne.restore();
	});

	suite('#put ', function () {

		function exercise () {
			return sut.put(principalId, domain, data, cb);
		}

		test('should get the data of the principal to modify', function(){
			exercise();
			sinon.assert.calledWithExactly(principalModelFindOne, {principalId: principalId, domain: domain}, sinon.match.func);
		});

		test('should save the changes of the principal', function () {
			var err;
			exercise();
			principalModelFindOne.callArgWith(1, err, principalItem);
			sinon.assert.calledWithExactly(principalItemSaveStub, sinon.match.func);
			assert.equal(data.foo, principalItem.foo);

		});

		test('should return the result of the save', function () {
			var err;
			exercise();
			principalModelFindOne.callArgWith(1, err, principalItem);
			principalItemSaveStub.callArgWith(0, err, principalItem);
			sinon.assert.calledWithExactly(cb, err, principalItem);
		});

		test('should return error when save failed', function () {
			var err = "fakeError";
			exercise();
			principalModelFindOne.callArgWith(1, null, principalItem);
			principalItemSaveStub.callArgWith(0, err, principalItem);
			sinon.assert.calledWithExactly(cb, err);
		});

		test('should return error when find failed', function () {
			var err = "fakeError";
			exercise();
			principalModelFindOne.callArgWith(1, err, principalItem);

			sinon.assert.calledWithExactly(cb, err);
		});
	});

});
