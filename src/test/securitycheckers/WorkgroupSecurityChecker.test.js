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

var assert = require('chai').assert;
var sinon = require('sinon');
var SecurityChecker = require('../../lib/securitycheckers/SecurityChecker');
var WorkgroupSecurityChecker = require('../../lib/securitycheckers/WorkgroupSecurityChecker');

suite('WorkgroupSecurityChecker', function () {
	var sut;
	var securityChecker;
	setup(function () {
		securityChecker = new SecurityChecker();
		sut = new WorkgroupSecurityChecker(securityChecker);
	});

	suite('#check', function () {
		var next;
		var req;
		var res;
		var sendStub;

		setup(function () {
			res = {
				send: function () {
				}
			};
			req = {
				method: 'DELETE',
				path: 'path to a workgroup'
			};
			next = sinon.stub();
			sendStub = sinon.stub(res, 'send');
		});

		function exercise() {
			return sut.check(req, res, next);
		}

		function stubSecurityCheckerIsAdminToReturn(retval) {
			sinon.stub(securityChecker, 'isAdmin')
				.returns(retval);
		}

		test('if req method is not DELETE then call next()', function () {
			req.method = 'NOT DELETE';
			exercise();
			assert.equal(next.callCount, 1);
		});

		test('if request comes from non-group admin then call res.send(403)', function () {
			stubSecurityCheckerIsAdminToReturn(false);
			exercise();
			assert.deepEqual(sendStub.args[0], [403]);
		});

		test('if request comes from group admin then call next', function () {
			stubSecurityCheckerIsAdminToReturn(true);
			exercise();
			assert.equal(next.callCount, 1);
		});
	});
});
