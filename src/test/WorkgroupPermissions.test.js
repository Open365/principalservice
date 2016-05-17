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
var expect = require('chai').expect;
var WorkgroupPermissions = require('../lib/WorkgroupPermissions');
var PermissionsServiceProvider = require('../lib/PermissionsServiceProvider');


suite('WorkgroupPermissions', function ()
{
    var sut;
    var permissionsServiceProvider, permissionsServiceProviderMock;
    var action, groupId, req, card, signature, expectedPermision;

    setup(function ()
    {
        action = '';
        groupId = '5490411df06a59902812e5bd';
        card = 'a card';
        signature = 'a signature';
        req = {
            headers: {
                card: card,
                signature: signature
            }
        };

        expectedPermision = 'eyeos.group.' + groupId + '.administrator';

        permissionsServiceProvider = new PermissionsServiceProvider();
        permissionsServiceProviderMock = sinon.mock(permissionsServiceProvider);

        sut = new WorkgroupPermissions(permissionsServiceProvider);
    });


    test('should call permissionsServiceProvider addPermissions', function ()
    {
        permissionsServiceProviderMock.expects('addPermissions').once().withExactArgs(expectedPermision, card, signature);
        sut.add(groupId, req);
        permissionsServiceProviderMock.verify();
    });

    test('should call permissionsServiceProvider removePermissions', function ()
    {
        permissionsServiceProviderMock.expects('removePermissions').once().withExactArgs(expectedPermision, card, signature);
        sut.remove(groupId, req);
        permissionsServiceProviderMock.verify();
    });



});
