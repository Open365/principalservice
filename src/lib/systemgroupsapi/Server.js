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

var BaucisInitializer = require('./BaucisInitializer');
var BusToHttpInitializer = require('./BusToHttpInitializer');
var bodyParser = require('body-parser');
var logger = require('log2out').getLogger('systemgroupsapi.Server');
var ManageProfilePermissionChecker = require('../securitycheckers/ManageProfilePermissionChecker');

var Server = function Server(settings, injectedExpressApp, injectedBaucisInitializer, injectedEyeosAuthMiddleware,
                             injectedBusToHttpInitializer, injectedManageProfilePermissionChecker) {
    if (!settings) {
        throw new Error('systetmgroupsapi.Server constructor missing mandatory parameter settings.');
    }

    this.settings = settings;
    this.app = injectedExpressApp || require('express')();
    this.baucisInitializer = injectedBaucisInitializer || new BaucisInitializer(settings);
    this.eyeosAuthenticationMiddleware = injectedEyeosAuthMiddleware || require('eyeos-auth').getAuthenticationExpressMiddleware();
    this.manageProfilePermissionChecker = injectedManageProfilePermissionChecker || new ManageProfilePermissionChecker();
    this.busToHttpInitializer = injectedBusToHttpInitializer || new BusToHttpInitializer(this.settings);
};

Server.prototype.ensureContentType = function ensureContentTypeMiddlewareFactory(contentType) {
    var logger = require('log2out').getLogger('ensureContentType');
    /**
     * ensureContentType: middleware for ensuring that request has expected Content-Type
     */
    return function ensureContentType(request, response, next){
        var reqContentType = request.get('Content-Type');
        if (reqContentType === contentType || request.method === 'GET' || request.method === 'OPTIONS') {
            return next();
        } else {
            var error = new Error("Unsupported Content-Type: '" + reqContentType + "'");
            error.status = 400;
            logger.debug('Wrong request ', request.method, request.originalUrl, reqContentType, error);
            return next(error);
        }
    };
};

Server.prototype.errorOnEveryonePutOrPost = function errorOnEveryonePutOrPostMiddlewareFactory() {
    var logger = require('log2out').getLogger('failOnDeleteOrPostOfEveryone');
    /**
     * errorOnEveryonePutOrPost: middleware for ensuring that POST or PUT are not issued to EVERYONE systemGroup
     */
    return function errorOnEveryonePutOrPost(request, response, next) {
        if (request.method === 'DELETE' || request.method === 'POST') {
            logger.debug('>>>', request.method, request.body._id);
            if(request.body && request.body._id && request.body._id === 'EVERYONE') {
                logger.debug('<<< next(Error("It is forbidden to POST or DELETE EVERYONE systemGroup"))');
                return next(new Error("It is forbidden to POST or DELETE EVERYONE systemGroup"));
            }
        }
        return next();
    };
};

Server.prototype.transformErrors = function transformErrorsMiddlewareFactory() {
    /**
     * transformErrors: middleware for transforming errors:
     * errors related to EVERYONE or ADMINISTRATOR are given a 403 status
     * other errors containing status are transformed to a standar structure.
     */
    return function transformErrors(error, request, response, next) {
        if (!error) {
            return next();
        }

        // some error regarding EVERYONE or ADMINISTRATOR
        if (error.message.indexOf('EVERYONE') !== -1 || error.message.indexOf('ADMINISTRATOR') !== -1) {
            return response.contentType('application/json')
                .status(403)
                .json({error: error.message})
                .send();
        } else if (error.status) {
            return response.contentType('application/json')
                .status(error.status)
                .json({error: error.message})
                .send();
        } else {
            return next();
        }
    };
};


Server.prototype.injectDummyCardAndSignature = function injectDummyCardAndSignatureMiddlewareFactory() {
    /**
     * injectDummyCardAndSignature: middleware for DEVELOPMENT_MODE
     * adds card and signature if not present in headers.
     */
    return function injectDummyCardAndSignature(request, response, next) {
        if (!request.headers.card || !request.headers.signature ) {
            logger.warn('Received request without card&signature, since EYEOS_DEVELOPMENT_MODE, injected a dummy one.');
            request.headers.card = '{"expiration":1430306976,"permissions":["eyeos.vdi.exec","eyeos.group.549013ae8254280d4c984fcf.administrator","eyeos.group.54916acf88c6c148155cf269.administrator","eyeos.group.5492c06cb10d44f4327581b3.administrator","eyeos.group.5492c147b10d44f4327581b5.administrator","eyeos.group.5492c20456cddde9342146e1.administrator","eyeos.group.5492c21456cddde9342146e3.administrator","eyeos.group.5492c2ac56cddde9342146eb.administrator","eyeos.group.5492c33d56cddde9342146ed.administrator","eyeos.group.5492c37456cddde9342146ef.administrator","eyeos.group.5492c39e56cddde9342146f1.administrator","eyeos.group.54bd375c1ac74f124cd7bbe3.administrator","eyeos.group.54bf7ab51ac74f124cd7bbea.administrator"],"renewCardDelay":12600,"username":"eyeos"}';
            request.headers.signature = "hB3SeNXGGHUZRrrZtMsSe0G6YMnZP1ThYe5+JLvMJ1JQhyPeLG+PjfhIEPiDqKHvQRUZgPGxNIiKOOrV4BZ1+Q==";

        }
        return next();
    };
};

Server.prototype.start = function start (){
    var app = this.app;
    var basePath = this.settings.path;
    var port = this.settings.port;
    var host = this.settings.host;

    var baucis = this.baucisInitializer.init();

    if (this.settings.EYEOS_DEVELOPMENT_MODE) {
        logger.warn('********************************************************************');
        logger.warn('*** SYSTEMGROUPSAPI STARTED WITH EYEOS_DEVELOPMENT_MODE === true ***');
        logger.warn('********************************************************************');

        var cors = require('cors');
        app.use(basePath, cors());
        app.use(basePath, this.injectDummyCardAndSignature());

    }

    app.use(basePath, this.ensureContentType('application/json'));
    app.use(basePath, this.eyeosAuthenticationMiddleware);
    app.use(basePath, bodyParser.json());
    app.use(basePath, this.errorOnEveryonePutOrPost());
    app.use(basePath, this.manageProfilePermissionChecker.check.bind(this.manageProfilePermissionChecker));
    app.use(basePath, baucis());
    app.use(this.transformErrors());

    app.listen(port, host);
    logger.info('Started systemgroupsapi.Server: %s:%d on path: %s', host, port, basePath);

    this.busToHttpInitializer.init();
};

module.exports = Server;
