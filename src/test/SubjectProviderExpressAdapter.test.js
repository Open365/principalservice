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
var SubjectProviderExpressAdapter = require('../lib/SubjectProviderExpressAdapter');
var SubjectProvider = require('../lib/SubjectProvider');
var PrincipalServiceError = require('../lib/utils/PrincipalServiceError');

suite('SubjectProviderExpressAdapter', function () {
    var sut;
    var subjectProvider;

    var req;
    var res;
    var next;

    setup(function () {
        req = {
            headers: {
                card: '{"username":"fake username"}'
            }
        };

        res = {
            send: function () {
            },
            status: function () {
            },
            json: function () {
            }
        };

        next = sinon.stub();

        subjectProvider = new SubjectProvider();
        sut = new SubjectProviderExpressAdapter(subjectProvider);
    });

    suite('#getUserSubjects', function () {
        var subjectProvider_getUserSubjectsStub;

        setup(function () {
            subjectProvider_getUserSubjectsStub = sinon.stub(subjectProvider, 'getUserSubjects');
        });

        function exercise () {
            return sut.getUserSubjects(req, res, next);
        }

        test('When everything is correct calls res.json with the subjects', function () {
            var subjects = "some subjects";
            var res_jsonStub = sinon.stub(res, 'json');
            subjectProvider_getUserSubjectsStub.returns(subjects);
            exercise();
            assert.deepEqual(res_jsonStub.args[0], [subjects]);
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
                subjectProvider_getUserSubjectsStub.throws(error);
                sinon.stub(error, 'getPublicInfo')
                    .withArgs(true)
                    // stub only returns publicInfo if called with true
                    .returns(publicInfo);
                return error;
            }

            test('When the model throws an error of type ERR_MODEL_GET_SUBJECT_BY_ID call res.status(500)', function () {
                prepareAndThrowError("ERR_MODEL_GET_SUBJECT_BY_ID")
                var res_statusStub = sinon.stub(res, 'status');
                exercise();
                assert.deepEqual(res_statusStub.args[0], [500]);
            });

            test('when the model throws an error of type ERR_MODEL_GET_SUBJECT_BY_ID call res.send() with public info', function () {
                prepareAndThrowError("ERR_MODEL_GET_SUBJECT_BY_ID")
                var res_sendStub = sinon.stub(res, 'send');
                exercise();
                assert.deepEqual(res_sendStub.args[0], [publicInfo]);
            });

            test('When the model throws an error of type ERR_MODEL_GET_SUBJECT_MEMBERSHIPS call res.status(500)', function () {
                prepareAndThrowError("ERR_MODEL_GET_SUBJECT_MEMBERSHIPS")
                var res_statusStub = sinon.stub(res, 'status');
                exercise();
                assert.deepEqual(res_statusStub.args[0], [500]);
            });

            test('when the model throws an error of type ERR_MODEL_GET_SUBJECT_MEMBERSHIPS call res.send() with public info', function () {
                prepareAndThrowError("ERR_MODEL_GET_SUBJECT_MEMBERSHIPS")
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
                };
            });
        });
    });
});
