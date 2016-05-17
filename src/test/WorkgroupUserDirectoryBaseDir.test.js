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
var WorkgroupUserDirectoryBaseDir = require('../lib/WorkgroupUserDirectoryBaseDir');

suite('WorkgroupUserDirectoryBaseDir', function(){
    var sut;
    var fakeFs, fsSpy, fsStub;
    var userId;

    setup(function() {
        userId = 'almond.daniels';
        fakeFs = {
            mkdirSync: function () {
            }
        };
    });

    suite('calls fs.mkdirSync', function() {
        setup(function(){
            fsSpy = sinon.spy(fakeFs, 'mkdirSync');
            sut = new WorkgroupUserDirectoryBaseDir(fakeFs);
        });

        test('ensureBaseUserWorkgroupDirExist when called should call fs.mkdirSync twice with correct params', function(){
            var firstExpectedDir = settings.mountPoint.path + '/users/' + userId;
            var secondExpectedDir = settings.mountPoint.path + '/users/' + userId + '/workgroups/';
            sut.ensureBaseUserWorkgroupDirExist(userId);
            assert.equal(firstExpectedDir, fsSpy.getCall(0).args[0]);
            assert.equal(secondExpectedDir, fsSpy.getCall(1).args[0]);
        });
    });

    suite('throws error', function() {

        setup(function() {
            fsStub = sinon.stub(fakeFs, 'mkdirSync');
            sut = new WorkgroupUserDirectoryBaseDir(fsStub);
        });

        test('ensureBaseUserWorkgroupDirExist when fs.mkdirSync throw error different than EEXIST should retrow', function(){
            fsStub.throws();
            var thrown = false;
            try {
                sut.ensureBaseUserWorkgroupDirExist(userId);
            } catch (e) {
                if (e.code !== 'EEXIST') {
                    thrown = true;
                }
            }
            assert.isTrue(thrown);
        });
        
    });





});
