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
var WorkgroupProviderExpressAdapter = require('../lib/WorkgroupProviderExpressAdapter');
var WorkgroupProvider = require('../lib/WorkgroupProvider');
var WorkgroupProviderErrorHandler = require('../lib/WorkgroupProviderErrorHandler');
var PrincipalServiceError = require('../lib/utils/PrincipalServiceError');

suite('WorkgroupProviderExpressAdapter', function () {
	var sut;
	var workgroupProvider, workgroupProviderErrorHandler;

	var req;
	var res;
	var next;
	var groupId = "fakeGroupId";

	setup(function () {
		req = {
			headers: {
				card: '{"username":"fake username"}'
			},
			params: [groupId]
		};

		res = {
			send: function () {
			},
			status: function () {
			},
			json: sinon.stub()
		};

		next = sinon.stub();

		workgroupProviderErrorHandler = new WorkgroupProviderErrorHandler();

		workgroupProvider = new WorkgroupProvider();
		sut = new WorkgroupProviderExpressAdapter(workgroupProvider, null, workgroupProviderErrorHandler);
	});

	suite('#getUserWorkgroups', function () {
		var workgroupProvider_getUserWorkgroupsStub;

		setup(function () {
			workgroupProvider_getUserWorkgroupsStub = sinon.stub(workgroupProvider, 'getUserWorkgroups');
		});

		function exercise () {
			return sut.getUserWorkgroups(req, res, next);
		}

		test('When everything is correct calls res.json with the workgroups', function () {
			var workgroups = "some workgroups";
			var res_jsonStub = res.json;
			workgroupProvider_getUserWorkgroupsStub.returns(workgroups);
			exercise();
			assert.deepEqual(res_jsonStub.args[0], [workgroups]);
		});

		suite('when shit happens', function () {
			var publicInfo;

			function prepareAndThrowError(errorCode) {
				publicInfo = "public info";
				var error = new PrincipalServiceError(
					"fake error message",
					errorCode,
					"fake data",
					"fake previous"
				);
				workgroupProvider_getUserWorkgroupsStub.throws(error);
				sinon.stub(error, 'getPublicInfo')
					.withArgs(true)
					// stub only returns publicInfo if called with true
					.returns(publicInfo);
				return error;
			}

			test('When the model throws an error of type ERR_MODEL_GET_WORKGROUP_BY_ID call res.status(500)', function () {
				prepareAndThrowError("ERR_MODEL_GET_WORKGROUP_BY_ID")
				var res_statusStub = sinon.stub(res, 'status');
				exercise();
				assert.deepEqual(res_statusStub.args[0], [500]);
			});

			test('when the model throws an error of type ERR_MODEL_GET_WORKGROUP_BY_ID call res.send() with public info', function () {
				prepareAndThrowError("ERR_MODEL_GET_WORKGROUP_BY_ID")
				var res_sendStub = sinon.stub(res, 'send');
				exercise();
				assert.deepEqual(res_sendStub.args[0], [publicInfo]);
			});

			test('When the model throws an error of type ERR_MODEL_GET_WORKGROUP_MEMBERSHIPS call res.status(500)', function () {
				prepareAndThrowError("ERR_MODEL_GET_WORKGROUP_MEMBERSHIPS")
				var res_statusStub = sinon.stub(res, 'status');
				exercise();
				assert.deepEqual(res_statusStub.args[0], [500]);
			});

			test('when the model throws an error of type ERR_MODEL_GET_WORKGROUP_MEMBERSHIPS call res.send() with public info', function () {
				prepareAndThrowError("ERR_MODEL_GET_WORKGROUP_MEMBERSHIPS")
				var res_sendStub = sinon.stub(res, 'send');
				exercise();
				assert.deepEqual(res_sendStub.args[0], [publicInfo]);
			});

			test('when the model throws an error of different type that the ones handled, rethrow the error', function () {
				var expectedThrownError = prepareAndThrowError("WHATEVER OTHER FAKE ERROR");
				try {
					exercise();
					assert.isFalse("Should have thrown an exception... fix this test.")
				} catch (actualError) {
					assert.deepEqual(actualError, expectedThrownError);
				}
			});
		});
	});

	suite('#getWorkgroupMembers', function () {
		var getWorkgroupMembersStub, errorHandlerStub;
		var resultData;

		setup(function () {
			resultData = [{
				fake: 'data'
			}];

			getWorkgroupMembersStub = sinon.stub(workgroupProvider, 'getWorkgroupMembers').returns(resultData);
		});

		function exercise() {
			return sut.getWorkgroupMembers(req, res, next);
		}

		test("calls workgroupProvider.getWorkgroupMembers", function () {
			exercise();
			sinon.assert.calledWithExactly(getWorkgroupMembersStub, groupId);
		});

		test("calls res.json with result data", function () {
			exercise();
			sinon.assert.calledWithExactly(res.json, resultData);
		});

		suite("when shit happens", function () {
			setup(function () {
				errorHandlerStub = sinon.stub(workgroupProviderErrorHandler, "handle");
			});

			test('calls to errorHandler.handle', function () {
				var err = new Error();
				getWorkgroupMembersStub.throws(err);
				exercise();
				sinon.assert.calledWithExactly(errorHandlerStub, err, res);
			});
		});
	});
});
