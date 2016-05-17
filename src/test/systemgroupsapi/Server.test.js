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

var sinon = require("sinon");
var assert = require("chai").assert;

var Server = require('../../lib/systemgroupsapi/Server');
var BaucisInitializer = require('../../lib/systemgroupsapi/BaucisInitializer');

var settings = require('../../lib/settings');

require('log2out').clearAppenders();

suite('systemgroupsapi.Server', function () {
    var server;
    var expressAppFake;
    var baucisInitializerStubbed;
    var baucisFunctionSpy;
    var eyeosAuthenticationMiddlewareFake;
    var busToHttpInitializerFake;
    setup(function () {
        expressAppFake = {
            use: sinon.spy(),
            listen: sinon.spy()
        };
        baucisInitializerStubbed = new BaucisInitializer(settings);
        sinon.stub(baucisInitializerStubbed, 'init').returns(function(){return 'initializedBaucis'});
        baucisFunctionSpy = sinon.spy();
        eyeosAuthenticationMiddlewareFake = sinon.spy();
        busToHttpInitializerFake = {init: sinon.spy()};

        server = new Server(settings, expressAppFake, baucisInitializerStubbed, eyeosAuthenticationMiddlewareFake, busToHttpInitializerFake);
    });

    teardown(function () {
    });


    test('Should throw when settings are not passed to constructor', function () {

        assert.throws(Server);

    });

    suite('#start', function () {
        test('Should initialize Baucis', function () {
            server.start();

            sinon.assert.calledOnce(baucisInitializerStubbed.init);
            sinon.assert.calledWithExactly(baucisInitializerStubbed.init);

        });

        test('Should call ensureContentType("application/json") to get middleware and use it in the app in the correct path', function () {
            var returnedMiddleware = sinon.spy();
            var ensureContentTypeStub = sinon.stub(server, 'ensureContentType').returns(returnedMiddleware);

            server.start();

            sinon.assert.calledOnce(ensureContentTypeStub);
            sinon.assert.calledWithExactly(ensureContentTypeStub, 'application/json');
            sinon.assert.called(expressAppFake.use);
            sinon.assert.calledWithExactly(expressAppFake.use, settings.path, returnedMiddleware);
        });

        test('Should use eyeos-auth middleware to validate request', function () {

            server.start();

            sinon.assert.called(expressAppFake.use);
            sinon.assert.calledWithExactly(expressAppFake.use, settings.path, eyeosAuthenticationMiddlewareFake);
        });

        test('Should call errorOnEveryonePutOrPost to get middleware and use it in the app in the correct path', function () {
            var returnedMiddleware = sinon.spy();
            var errorOnEveryonePutOrPostStub = sinon.stub(server, 'errorOnEveryonePutOrPost').returns(returnedMiddleware);

            server.start();

            sinon.assert.calledOnce(errorOnEveryonePutOrPostStub);
            sinon.assert.called(expressAppFake.use);
            sinon.assert.calledWithExactly(expressAppFake.use, settings.path, returnedMiddleware);
        });

        test('Should set the app to use the initialized Baucis in the correct path', function () {
            server.start();

            sinon.assert.called(expressAppFake.use);
            sinon.assert.calledWithExactly(expressAppFake.use, settings.path, eyeosAuthenticationMiddlewareFake);
        });

        test('Should call transformErrors to get middleware and use it in the app (without path parameter)', function () {
            var returnedMiddleware = sinon.spy();
            var transformErrorsStub = sinon.stub(server, 'transformErrors').returns(returnedMiddleware);

            server.start();

            sinon.assert.calledOnce(transformErrorsStub);
            sinon.assert.called(expressAppFake.use);
            sinon.assert.calledWithExactly(expressAppFake.use, returnedMiddleware);
        });

        test('Should set the app to listen in the correct port & host', function () {
            server.start();

            sinon.assert.calledOnce(expressAppFake.listen);
            sinon.assert.calledWithExactly(expressAppFake.listen, settings.port, settings.host);
        });

        test('Should initialize BusToHttp using its initializer', function () {
            server.start();

            sinon.assert.called(busToHttpInitializerFake.init);
            sinon.assert.calledWithExactly(busToHttpInitializerFake.init);
        });
    });

    suite('#errorOnEveryonePutOrPost', function () {

        test('Should return an Express regular middleware', function () {
            var middleware = server.errorOnEveryonePutOrPost();

            assert.isFunction(middleware);
            assert.lengthOf(middleware, 3);
        });

        test('Should call next without parameters is not DELETE or POST, or object is NOT EVERYONE', function () {
            var requests = [
                {method: 'PUT', body: {_id: 'EVERYONE'}},
                {method: 'GET',body: {_id: 'EVERYONE'}},
                {method: 'HEAD',body: {_id: 'EVERYONE'}},
                {method: 'POST',body: {_id: 'NOT-EVERYONE-BUT-ANOTHER'}},
                {method: 'DELETE',body: {_id: 'NOT-EVERYONE-BUT-ANOTHER'}},
                {method: 'GET',body: {_id: 'NOT-EVERYONE-BUT-ANOTHER'}}
            ];

            requests.forEach(function(request) {
                var response = {};
                var next = sinon.spy();

                var middleware = server.errorOnEveryonePutOrPost();
                middleware(request, response, next);

                sinon.assert.calledWithExactly(next);//'Expected next to be called without parameters for: '+request.method+' and '+request.body.id
            });
        });

        test('Should call next with an Error instance when request is DELETE or POST and object is EVERYONE', function () {
            var requests = [
                {method: 'POST', body: {_id: 'EVERYONE'}},
                {method: 'DELETE',body: {_id: 'EVERYONE'}}
            ];

            requests.forEach(function(request) {
                var response = {};
                var next = sinon.spy();

                var middleware = server.errorOnEveryonePutOrPost();
                middleware(request, response, next);

                //'Expected next to be called with error for: '+request.method+' and '+request.body.id
                sinon.assert.calledWithExactly(next, sinon.match.instanceOf(Error));
            });
        });
    });


    suite('#ensureContentType', function () {

        test('Should return an Express regular middleware', function () {
            var middleware = server.ensureContentType('application/json');

            assert.isFunction(middleware);
            assert.lengthOf(middleware, 3);
        });

        test('Should call next without parameters when Content-Type is application/json', function () {
            var requests = [
                {method: 'PUT', originalUrl: '/api/v1/blah', get: function(param){if(param === 'Content-Type') return 'application/json'}},
                {method: 'POST', originalUrl: '/api/v1/blah/blah', get: function(param){if(param === 'Content-Type') return 'application/json'}}
            ];

            requests.forEach(function(request) {
                var response = {};
                var next = sinon.spy();

                var middleware = server.ensureContentType('application/json');
                middleware(request, response, next);

                sinon.assert.calledWithExactly(next);//'Expected next to be called without parameters for: request with Content-Type: application/json
            });
        });

        test('Should call next without parameters when request is GET and no Content-Type', function () {
            var requests = [
                {method: 'GET', originalUrl: '/api/v1/blah', get: function(param){if(param === 'Content-Type') return undefined}}
            ];

            requests.forEach(function(request) {
                var response = {};
                var next = sinon.spy();

                var middleware = server.ensureContentType('application/json');
                middleware(request, response, next);

                sinon.assert.calledWithExactly(next);//'Expected next to be called without parameters for: request with Content-Type: application/json
            });
        });

        test('Should call next with error 400 Content-Type is NOT application/json', function () {
            var requests = [
                {method: 'PUT', originalUrl: '/api/v1/blah', get: function(param){if(param === 'Content-Type') return 'text/plain'}},
                {method: 'POST', originalUrl: '/api/v1/blah/blah', get: function(param){if(param === 'Content-Type') return 'application/x-www-form-urlencoded'}}
            ];

            requests.forEach(function(request) {
                var response = {};
                var next = sinon.spy();

                var middleware = server.ensureContentType('application/json');
                middleware(request, response, next);

                sinon.assert.calledOnce(next);
                sinon.assert.calledWithExactly(next, sinon.match.instanceOf(Error));//'Expected next to be called without parameters for: request with Content-Type: application/json
                assert.equal(400, next.firstCall.args[0].status);
            });
        });
    });



});
