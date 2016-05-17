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
var PolicySet = require('../lib/PolicySet');

suite('PolicySet', function(){
	var sut;
	var claims, expectedGroupIds;

	setup(function(){
		expectedGroupIds = ['547c813627e862d730c9bc4e', '547885e97cc2a60056bceddc', '547ef7bc9a97baa36e51e1f6'];

		claims = [
			'eyeos.group.' + expectedGroupIds[0] + '.administrator',
			'eyeos.group.' + expectedGroupIds[1] + '.administrator',
			'eyeos.group.' + expectedGroupIds[2] + '.administrator'
		];

		sut = new PolicySet(claims);
	});

	suite('getAdministratedGroups', function(){

		test('should return correct values', function(){
			var actualGroupIds = sut.getAdministratedGroups();
			assert.deepEqual(actualGroupIds, expectedGroupIds);
		});

	});

});
