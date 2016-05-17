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

'use strict';
var sinon = require('sinon');
var assert = require('chai').assert;
var PrincipalServiceError = require('../../lib/utils/PrincipalServiceError');


suite('PrincipalServiceError suite', function () {
	var sut,
		msg,
		code,
		internalCode,
		data,
		previous;

	setup(function () {
		msg = 'aMsg';
		code = 'AN_ERROR_CODE';
		// obtain internalCode with: printf AN_ERROR_CODE | openssl md5 -binary | base64
		internalCode = '6DpNhKONaBrEjsIH0Rwk2Q==';
		data = {
			groupId: 'A_group_id'
		};
		previous = new Error('aPreviousError');

		sut = new PrincipalServiceError(msg, code, data, previous);
	});

	test("has stack attribute", function () {
		assert.isDefined(sut.stack);
	});

	suite('#getPublicInfo', function () {

		function exercise (isInternalError) {
			return sut.getPublicInfo(isInternalError);
		}

		test('when is not internal error returns a pojo with data fields and code', sinon.test(function () {
			var retVal = exercise();
			assert.deepEqual(retVal, {
				groupId: data.groupId,
				code: code
			});
		}));

		test('when is internal error returns a pojo with limited info', sinon.test(function () {
			var expected = {
				code: "INTERNAL_ERROR",
				internalCode: internalCode
			};
			var actual = exercise(true);

			assert.deepEqual(actual, expected);
		}));

		test('when settings.throwExceptionsToClient is true the publicInfo includes a stack', sinon.test(function () {
			sut.settings.throwExceptionsToClient = true;
			var publicInfo = exercise();
			assert.isDefined(publicInfo.stack);
		}));

		test('when settings.throwExceptionsToClient is false the publicInfo does not include a stack', sinon.test(function () {
			sut.settings.throwExceptionsToClient = false;
			var publicInfo = exercise();
			assert.isUndefined(publicInfo.stack);
		}));
	});
});

