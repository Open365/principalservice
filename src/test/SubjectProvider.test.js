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
var SubjectProvider = require('../lib/SubjectProvider');
var PrincipalServiceError = require('../lib/utils/PrincipalServiceError');


suite('SubjectProvider', function ()
{
    var sut;
    var fakeWaitFor, waitForStub;
    var memberships;
    var workgroup, membershipsWorkgroup, principalsInWorkgroup;
    var subject1, membershipsSubject1, principalsInSubject1;
    var subject2, membershipsSubject2, principalsInSubject2;
    var thrownError;

    setup(function ()
    {
        memberships = [{
            groupId: '5490411df06a59902812e5bd',
            memberId: 'sergi.fernandez'
        }, {
            groupId: '5490411df06a59902812e5ba',
            memberId: 'sergi.fernandez'
        }, {
            groupId: '5490411df06a59902812e5bk',
            memberId: 'sergi.fernandez'
        }];
        workgroup = {
            _id: '5490411df06a59902812e5bk',
            name: 'Developers',
            description: 'Developers group',
            extra_params: {"tags":["workgroup"]}
        };
        membershipsWorkgroup = [
            {groupId: '5490411df06a59902812e5bk', memberId: 'sergi.fernandez'},
            {groupId: '5490411df06a59902812e5bk', memberId: 'dani.ametller'},
            {groupId: '5490411df06a59902812e5bk', memberId: 'carlos.campderros'}
        ];
        principalsInWorkgroup = [
            {principalId: 'sergi.fernandez'},
            {principalId: 'dani.ametller'},
            {principalId: 'carlos.campderros'}
        ];
        subject1 = {
            _id: '5490411df06a59902812e5bd',
            name: 'Math',
            description: 'Math group',
            extra_params: {"tags":["subject"]}
        };
        membershipsSubject1 = [
            {groupId: '5490411df06a59902812e5bd', memberId: 'sergi.fernandez'},
            {groupId: '5490411df06a59902812e5bd', memberId: 'dani.ametller'},
            {groupId: '5490411df06a59902812e5bd', memberId: 'jordi.nistal'}
        ];
        principalsInSubject1 = [
            {principalId: 'sergi.fernandez'},
            {principalId: 'dani.ametller'},
            {principalId: 'jordi.nistal'}
        ];
        subject2 = {
            _id: '5490411df06a59902812e5ba',
            name: 'Science',
            description: 'Science group',
            extra_params: {"tags":["subject"]}
        };
        membershipsSubject2 = [
            {groupId: '5490411df06a59902812e5ba', memberId: 'sergi.fernandez'},
            {groupId: '5490411df06a59902812e5ba', memberId: 'dani.ametller'},
            {groupId: '5490411df06a59902812e5ba', memberId: 'carlos.campderros'}
        ];
        principalsInSubject2 = [
            {principalId: 'sergi.fernandez'},
            {principalId: 'dani.ametller'},
            {principalId: 'carlos.campderros'}
        ];

        thrownError = new Error('anyError');

        fakeWaitFor = {
            forMethod: function () {
            }
        };
        waitForStub = sinon.stub(fakeWaitFor, 'forMethod');

        sut = new SubjectProvider(fakeWaitFor);
    });

    suite('getUserSubjects', function ()
    {

        test('When all subjects ok returns correct pojo', function ()
        {
            var expected = [
                {
                    id: '5490411df06a59902812e5bd',
                    name: 'Math',
                    description: 'Math group',
                    extra_params: {"tags":["subject"]},
                    members: [
                        {principalId: 'sergi.fernandez'},
                        {principalId: 'dani.ametller'},
                        {principalId: 'jordi.nistal'}]
                }, {
                    id: '5490411df06a59902812e5ba',
                    name: 'Science',
                    description: 'Science group',
                    extra_params: {"tags":["subject"]},
                    members: [
                        {principalId: 'sergi.fernandez'},
                        {principalId: 'dani.ametller'},
                        {principalId: 'carlos.campderros'}
                    ]}];

            waitForStub.onCall(0).returns(memberships);
            waitForStub.onCall(1).returns(subject1);
            waitForStub.onCall(2).returns(membershipsSubject1);
            waitForStub.onCall(3).returns(principalsInSubject1);
            waitForStub.onCall(4).returns(subject2);
            waitForStub.onCall(5).returns(membershipsSubject2);
            waitForStub.onCall(6).returns(principalsInSubject2);
            var actual = sut.getUserSubjects('sergi.fernandez');

            assert.deepEqual(actual, expected);
        });

        test('When getting a subject throws an error should throw correct error', function ()
        {
            var expectedError = new PrincipalServiceError(
                "Unable to get subject: " + memberships[0].groupId,
                "ERR_MODEL_GET_SUBJECT_BY_ID",
                { subjectId: memberships[0].groupId},
                thrownError
            );

            waitForStub.onCall(0).returns(memberships);
            waitForStub.onCall(1).throws(thrownError);

            try {
                sut.getUserSubjects('sergi.fernandez');
            } catch (actualError) {
                assert.deepEqual(actualError, expectedError);
            }
        });

        test('When getting assignations for a subject throws an error should throw correct error', function ()
        {
            var expectedError = new PrincipalServiceError(
                "Unable to get subject memberships: " + memberships[0].groupId,
                "ERR_MODEL_GET_SUBJECT_MEMBERSHIPS",
                { subjectId: memberships[0].groupId},
                thrownError
            );

            waitForStub.onCall(0).returns(memberships);
            waitForStub.onCall(1).returns(subject1);
            waitForStub.onCall(2).throws(thrownError);

            try {
                sut.getUserSubjects('sergi.fernandez');
            } catch (actualError) {
                assert.deepEqual(actualError, expectedError);
            }
        });
    });
});
