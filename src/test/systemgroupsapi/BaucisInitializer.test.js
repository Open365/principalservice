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

var settings = require('../../lib/settings');
var BaucisInitializer = require('../../lib/systemgroupsapi/BaucisInitializer');

require('log2out').clearAppenders();

suite('BaucisInitializer', function() {
    var baucisInitializer;
    var baucisFake;
    var mongooseFake;
    var baucisControllerFake;

    setup(function() {
        baucisControllerFake = {
            findBy: sinon.spy()
        };
        baucisFake = {
            rest: sinon.stub().returns(baucisControllerFake)
        };
        mongooseFake = require('mongoose');
        sinon.stub(mongooseFake, 'connect');

        baucisInitializer = new BaucisInitializer(settings.systemGroups, baucisFake, mongooseFake);
    });

    teardown(function(){
        mongooseFake.connect.restore();
    });

    test('Should throw when settings are not passed to constructor', function () {

        assert.throws(BaucisInitializer);

    });

    suite('#init', function() {

        test('Should connect to mongoose', function () {
            baucisInitializer.init();

            sinon.assert.calledOnce(mongooseFake.connect);
            sinon.assert.calledWithExactly(mongooseFake.connect, sinon.match('mongodb://mongo.service.consul:27017'));
        });

        test('Should initalize baucis for SystemGroups', function () {
            baucisInitializer.init();

            sinon.assert.calledWithExactly(baucisFake.rest, 'SystemGroup');
        });

        test('Should initalize baucis for PrincipalSystemGroupAssignation', function () {
            baucisInitializer.init();

            sinon.assert.calledWithExactly(baucisFake.rest, 'PrincipalSystemGroupAssignation');
        });

        test('Should return the baucis instance', function () {
            var baucis = baucisInitializer.init();

            assert.equal(baucis, baucisFake);
        });

    });
});
