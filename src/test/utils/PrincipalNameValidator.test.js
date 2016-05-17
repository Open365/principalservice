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
	PrincipalNameValidator = require('../../lib/utils/PrincipalNameValidator');

suite('PrincipalNameValidator', function(){
	var sut;
	var name = 'kartoffeln';

	setup(function(){
		sut = new PrincipalNameValidator();
	});

	suite('#validateName', function() {
		test('should assert the name is invalid when includes invalid chars', function(){
			assert.isFalse(sut.isNameValid('?**<>'));
		});

		test('should assert the name is valid when includes no invalid chars', function() {
			assert.isTrue(sut.isNameValid(name));
		});

		function generateLengthyName(length) {
			var name = "";
			for (var i = 0; i < length; i++) {
				name += 'a';
			}
			return name;
		}

		test('should assert the name is not valid when it is too long', function () {
			assert.isFalse(sut.isNameValid(generateLengthyName(201)));
		});

		test('should assert the name is valid when it is max length', function () {
			assert.isTrue(sut.isNameValid(generateLengthyName(200)));
		});

		test('should assert the name is not valid when it contains ..', function () {
			assert.isFalse(sut.isNameValid('a folder .. with dots'));
		});

		test('should assert the name is not valid when it starts with .', function () {
			assert.isFalse(sut.isNameValid('.startingwithdot'));
		});
	});
});
