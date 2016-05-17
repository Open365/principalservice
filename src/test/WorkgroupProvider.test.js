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
var WorkgroupProvider = require('../lib/WorkgroupProvider');
var PrincipalServiceError = require('../lib/utils/PrincipalServiceError');


suite('WorkgroupProvider', function ()
{
    var sut;
    var fakeWaitFor, waitForStub;
    var memberships, workgroup1, workgroup2, membershipsWorkgroup1, membershipsWorkgroup2, principalsInWorkgroup1, principalsInWorkgroup2;
    var thrownError;

    setup(function ()
    {
        memberships = [{
            groupId: '5490411df06a59902812e5bd',
            memberId: 'sergi.fernandez'
        }, {
            groupId: '5490411df06a59902812e5ba',
            memberId: 'sergi.fernandez'
        }];
        workgroup1 = {
            _id: '5490411df06a59902812e5bd',
            name: 'Developers',
            description: 'Developers group',
            extra_params: {"tags":["developers"]}
        };
        workgroup2 = {
            _id: '5490411df06a59902812e5ba',
            name: 'Backend',
            description: 'Backend developers group',
            extra_params: {"tags":["backend"]}
        };
        membershipsWorkgroup1 = [
            {groupId: '5490411df06a59902812e5bd', memberId: 'sergi.fernandez'},
            {groupId: '5490411df06a59902812e5bd', memberId: 'dani.ametller'},
            {groupId: '5490411df06a59902812e5bd', memberId: 'jordi.nistal'}
        ];
		principalsInWorkgroup1 = [
			{principalId: 'sergi.fernandez'},
			{principalId: 'dani.ametller'},
			{principalId: 'jordi.nistal'}
		];
		membershipsWorkgroup2 = [
			{groupId: '5490411df06a59902812e5ba', memberId: 'sergi.fernandez'},
			{groupId: '5490411df06a59902812e5ba', memberId: 'dani.ametller'},
			{groupId: '5490411df06a59902812e5ba', memberId: 'carlos.campderros'}
		];
        principalsInWorkgroup2 = [
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

        sut = new WorkgroupProvider(fakeWaitFor);
    });

    suite('getUserWorkgroups', function ()
    {
        
        test('When all works ok returns correct pojo', function ()
        {
            var expected = [
                {
                    id: '5490411df06a59902812e5bd',
                    name: 'Developers',
                    description: 'Developers group',
                    extra_params: {"tags":["developers"]},
                    members: [
						{principalId: 'sergi.fernandez'},
						{principalId: 'dani.ametller'},
						{principalId: 'jordi.nistal'}]
                }, {
                    id: '5490411df06a59902812e5ba',
                    name: 'Backend',
                    description: 'Backend developers group',
                    extra_params: {"tags":["backend"]},
                    members: [{principalId: 'sergi.fernandez'},
				{principalId: 'dani.ametller'},
				{principalId: 'carlos.campderros'}
                ]}];

            waitForStub.onCall(0).returns(memberships);
            waitForStub.onCall(1).returns(workgroup1);
            waitForStub.onCall(2).returns(membershipsWorkgroup1);
            waitForStub.onCall(3).returns(principalsInWorkgroup1);
			waitForStub.onCall(4).returns(workgroup2);
			waitForStub.onCall(5).returns(membershipsWorkgroup2);
			waitForStub.onCall(6).returns(principalsInWorkgroup2);
            var actual = sut.getUserWorkgroups('sergi.fernandez');

            assert.deepEqual(actual, expected);
        });

        test('When getting a workgroup throws an error should throw correct error', function ()
        {
            var expectedError = new PrincipalServiceError(
                "Unable to get workgroup: " + memberships[0].groupId,
                "ERR_MODEL_GET_WORKGROUP_BY_ID",
                { workgroupId: memberships[0].groupId},
                thrownError
            );

            waitForStub.onCall(0).returns(memberships);
            waitForStub.onCall(1).throws(thrownError);

            try {
                sut.getUserWorkgroups('sergi.fernandez');
            } catch (actualError) {
                assert.deepEqual(actualError, expectedError);
            }
        });

        test('When getting assignations for a workgroup throws an error should throw correct error', function ()
        {
            var expectedError = new PrincipalServiceError(
                "Unable to get workgroup memberships: " + memberships[0].groupId,
                "ERR_MODEL_GET_WORKGROUP_MEMBERSHIPS",
                { workgroupId: memberships[0].groupId},
                thrownError
            );

            waitForStub.onCall(0).returns(memberships);
            waitForStub.onCall(1).returns(workgroup1);
            waitForStub.onCall(2).throws(thrownError);

            try {
                sut.getUserWorkgroups('sergi.fernandez');
            } catch (actualError) {
                assert.deepEqual(actualError, expectedError);
            }
        });
    });

    suite("#getWorkgroupMembers", function () {

        var groupMemberships, groupMembers, groupId;

        setup(function () {
            groupId = "562a33aebd6c39dd2e5a1142";
            groupMemberships = [{
                "groupId": "562a33aebd6c39dd2e5a1142",
                "memberId": "eyeos"
            }, {
                "groupId": "562a33aebd6c39dd2e5a1142",
                "memberId": "eyeos1"
            }, {
                "groupId": "562a33aebd6c39dd2e5a1142",
                "memberId": "eyeos2"
            }];

            groupMembers = [{
                "principalId": "eyeos1",
                "lastName": "Chaplin",
                "firstName": "Charles",
                "mustChangePassword": false,
                "systemGroups": [],
                "permissions": []
            }, {

                "principalId": "eyeos",
                "lastName": "Stinson",
                "firstName": "Barney",
                "mustChangePassword": false,
                "systemGroups": [],
                "permissions": [
                    "eyeos.group.562a33aebd6c39dd2e5a1142.administrator",
                    "eyeos.group.562a3bdd0a20fbe2373c6a7b.administrator"
                ]
            }, {

                "principalId": "eyeos2",
                "lastName": "eyeos",
                "firstName": "",
                "mustChangePassword": false,
                "systemGroups": [],
                "permissions": [
                    "eyeos.subject.562a33aebd6c39dd2e5a1142.teacher",
                    "eyeos.subject.562a3bdd0a20fbe2373c6a7b.student"
                ]
            }];
        });

        test("returns the list of members", function () {

            var expected = [{
                "id": "eyeos1",
                "lastName": "Chaplin",
                "firstName": "Charles",
                "role": ""
            }, {
                "id": "eyeos",
                "lastName": "Stinson",
                "firstName": "Barney",
                "role": "eyeos.group.562a33aebd6c39dd2e5a1142.administrator"
            }, {
                "id": "eyeos2",
                "lastName": "eyeos",
                "firstName": "",
                "role": "eyeos.subject.562a33aebd6c39dd2e5a1142.teacher"

            }];

            waitForStub.onCall(0).returns(groupMemberships);
            waitForStub.onCall(1).returns(groupMembers);

            var actual = sut.getWorkgroupMembers(groupId);
            assert.deepEqual(actual, expected);

        });
    });
});
