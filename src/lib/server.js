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

var express = require('express');
var mongoose = require('mongoose');
var baucis = require('baucis');
var settings = require('./settings.js');
var bodyParser = require('body-parser');
var WorkGroupSchema = require('./models/WorkGroupSchema');
var MembershipSchema = require('./models/MembershipSchema');
var PrincipalSchema = require('./models/PrincipalSchema');
var AmqpToHttp = require('eyeos-restutils').AmqpToHttp;
var WorkgroupSecurityChecker = require('./securitycheckers/WorkgroupSecurityChecker');
var MembershipSecurityChecker = require('./securitycheckers/MembershipSecurityChecker');
var MembershipProviderExpressAdapter = require('./MembershipProviderExpressAdapter');
var AuthenticationChecker = require('./securitycheckers/AuthenticationChecker');
var log2out = require('log2out');
var WorkgroupDirectory = require('./WorkgroupDirectory');
var WorkgroupDirectoryExpressAdapter = require('./WorkgroupDirectoryExpressAdapter');
var WorkgroupUserDirectory = require('./WorkgroupUserDirectory');
var WorkgroupUserDirectoryExpressAdapter = require('./WorkgroupUserDirectoryExpressAdapter');
var PrincipalsProviderExpressAdapter = require('./PrincipalsProviderExpressAdapter');
var changePasswordExpressAdapter = require('./ChangePasswordExpressAdapter');
var WorkgroupProviderExpressAdapter = require('./WorkgroupProviderExpressAdapter');
var SubjectProviderExpressAdapter = require('./SubjectProviderExpressAdapter');
var wait = require('wait.for');
var WorkgroupPermissions = require('./WorkgroupPermissions');
var TestabilityServer = require('./TestabilityServer');
var PrincipalServiceError = require('./utils/PrincipalServiceError');
var RequestParser = require('./utils/RequestParser');
var MembersNotifier = require('./MembersNotifier');
var MembersNotifierExpressAdapter = require('./MembersNotifierExpressAdapter');
var WorkgroupEventService = require('./events/WorkgroupEventService');

var ContactManager = require("./ContactManager");

// FIXME: this is not handling concurrent requests!!!! migration from previous approach using process + node.js domains
var moduleContext = {};

var Server = function () {
    this.logger = log2out.getLogger('Server');
    this.workgroupSecurityChecker = new WorkgroupSecurityChecker();
    this.membershipSecurityChecker = new MembershipSecurityChecker();
    this.membershipProviderExpressAdapter = new MembershipProviderExpressAdapter();
    this.authenticationChecker = new AuthenticationChecker();
    this.workgroupDirectoryExpressAdapter = new WorkgroupDirectoryExpressAdapter();
    this.workgroupUserDirectory = new WorkgroupUserDirectory();
    this.workgroupUserDirectoryExpressAdapter = new WorkgroupUserDirectoryExpressAdapter();
    this.principalsProviderExpressAdapter = new PrincipalsProviderExpressAdapter();
    this.changePasswordExpressAdapter = new changePasswordExpressAdapter();
    this.workgroupProviderExpressAdapter = new WorkgroupProviderExpressAdapter();
    this.subjectProviderExpressAdapter = new SubjectProviderExpressAdapter();
    this.workgroupPermissions = new WorkgroupPermissions();
    this.app = express();
    this.testabilityServer = new TestabilityServer();
    this.requestParser = new RequestParser();
    this.membersNotifier = new MembersNotifier();
    this.membersNotifierExpressAdapter = new MembersNotifierExpressAdapter();
    /**
     * XXX: Currently, even when the workgroupService and the principalService are different ones, they share the same
     * physical deployment, so emitting an event to the queue is not need.
     *
     * So I'm going to keep it simple, I'll use a custom implementation of the WorkgroupEventService that actually
     * inserts the elements on their repository without using any intermediate event bus.
     *
     * XXX: When using the event bus because the previous services deploy separately, use the default WorkgroupEventService
     * implementation that emits the event to the bus.
     */
    this.workgroupEventService = new WorkgroupEventService.Direct();
    this.contactManager = new ContactManager();
};


Server.prototype.start = function () {
    this._startServer();
    this.testabilityServer.start();
};

Server.prototype._initMongoose = function (){
    var self = this;
    mongoose.connect('mongodb://' + settings.mongo.host + '/' + settings.mongo.db);

    var workgroupModel = mongoose.model('workgroup', WorkGroupSchema);
    workgroupModel.on('index', function(err) {
        if(err) {
            console.log("Error creating indexes for workgroups", err);
            throw err;
        }
    });
    var membershipModel = mongoose.model('membership', MembershipSchema);
    membershipModel.on('index', function(err) {
        if(err) {
            console.log("Error creating indexes for memberships", err);
            throw err;
        }
    });
    var principalModel = mongoose.model('principal', PrincipalSchema);
    principalModel.on('index', function(err) {
        if(err) {
            console.log("Error creating indexes for principals", err);
            throw err;
        }
    });

    //@TODO: Pucking! Action will made in the moongoose middlewares
    WorkGroupSchema.post('save', function (doc) {
        var activeDomain = {_req: moduleContext.req};
        if (activeDomain && activeDomain._req) {
            // notify other services that we are going to create a workgroup
            self.workgroupEventService.workgroupCreated(doc._id, doc.name, doc.description, doc.extra_params);

            var request = activeDomain._req;
            self.workgroupPermissions.add(doc._id, request);
            // Add membership & create userworkgroupdirectory
            var userId = self.requestParser.extractUserIdFromHeaders(request),
                membership = mongoose.model('membership', MembershipSchema),
                newMember = new membership({ groupId: doc._id, memberId: userId });
            newMember.save(function (err) {
                if (err) {
                    self.logger.error('Error saving membership', err);
                }
            });
            wait.launchFiber(function () {
                self.workgroupUserDirectory.create(userId, doc.name);
            });
        }
    });

    WorkGroupSchema.post('remove', function (doc) {
        var activeDomain = process.domain;
        if (activeDomain && activeDomain._req)
        {
            var request = activeDomain._req;
            self.workgroupPermissions.remove(doc._id, request);
        }
        var membership = mongoose.model('membership', MembershipSchema);
        var query = membership.where("groupId").equals(doc._id);
        query.exec(function (err, memberships) {
            for (var i = 0; i < memberships.length; i++) {
                self.workgroupUserDirectory.erase(memberships[i].memberId, doc.name);
                self.membersNotifier.workgroupDeleted(memberships[i].memberId, doc._id);
                memberships[i].remove();
            }
        });
    });
};

Server.prototype._addDevelopmentModeMiddlewares = function () {
    var self = this;
    self.logger.warn('*********************************************************************');
    self.logger.warn('*** PRINCIPALSERVICE STARTED WITH EYEOS_DEVELOPMENT_MODE === true ***');
    self.logger.warn('*********************************************************************');

    var cors = require('cors');
    this.app.use('/', cors());
    this.app.use('/', function injectDummyCardAndSignature(request, response, next) {
        if (!request.headers.card || !request.headers.signature ) {
            self.logger.warn('Received request without card&signature, since EYEOS_DEVELOPMENT_MODE, injected a dummy one.');
            request.headers.card = '{"expiration":1430306976,"permissions":["eyeos.vdi.exec","eyeos.group.549013ae8254280d4c984fcf.administrator","eyeos.group.54916acf88c6c148155cf269.administrator","eyeos.group.5492c06cb10d44f4327581b3.administrator","eyeos.group.5492c147b10d44f4327581b5.administrator","eyeos.group.5492c20456cddde9342146e1.administrator","eyeos.group.5492c21456cddde9342146e3.administrator","eyeos.group.5492c2ac56cddde9342146eb.administrator","eyeos.group.5492c33d56cddde9342146ed.administrator","eyeos.group.5492c37456cddde9342146ef.administrator","eyeos.group.5492c39e56cddde9342146f1.administrator","eyeos.group.54bd375c1ac74f124cd7bbe3.administrator","eyeos.group.54bf7ab51ac74f124cd7bbea.administrator"],"renewCardDelay":12600,"username":"eyeos"}';
            request.headers.signature = "hB3SeNXGGHUZRrrZtMsSe0G6YMnZP1ThYe5+JLvMJ1JQhyPeLG+PjfhIEPiDqKHvQRUZgPGxNIiKOOrV4BZ1+Q==";

        }
        return next();
    });
};

Server.prototype._addMembershipsRoutes = function () {
    var self = this;
    this.app.use('/memberships', this.membershipSecurityChecker.check.bind(this.membershipSecurityChecker));

    this.app.post('/memberships', this.membershipProviderExpressAdapter.removeCurrentUserFromBody.bind(this.membershipProviderExpressAdapter));

    this.app.post('/memberships', function (req, res, next) {
        wait.launchFiber(function () {
            self.workgroupUserDirectoryExpressAdapter.create(req, res, next);
        });
    });
    this.app.delete('/memberships', function (req, res, next) {
        wait.launchFiber(function () {
            self.workgroupUserDirectoryExpressAdapter.erase(req, res, next);
            self.membersNotifierExpressAdapter.userRemovedFromWorkgroup(req, res, next);
        });
    });
};

Server.prototype._addPrincipalsRoutes = function () {
    var self = this;

    this.app.get('/principals/me', function (req, res, next) {
        self.principalsProviderExpressAdapter.getMe(req, res, next);
    });

    this.app.put('/principals/me', function (req, res, next) {
        self.principalsProviderExpressAdapter.putMe(req, res, next);
    });

    // get user contacts
    this.app.get('/principals/me/contacts/', function (req, res, next) {
        var principalId = self.requestParser.extractUserIdFromHeaders(req);
        var domain = self.requestParser.extractDomainFromHeaders(req);
        self.contactManager.getContacts(principalId, domain, function (err, data) {
            if (err) {
                self.logger.error(err);
                res.status(400).send();
                return;
            }
            res.status(200).send(JSON.stringify(data));
        });
    });

    // get contacts that have the user as a contact
    this.app.get('/principals/contacts/me/', function (req, res, next) {
        var principalId = self.requestParser.extractUserIdFromHeaders(req);
        var domain = self.requestParser.extractDomainFromHeaders(req);
        self.contactManager.getContactsThatHaveMe(principalId, domain, function (err, data) {
            if (err) {
                self.logger.error(err);
                res.status(400).send();
                return;
            }
            res.status(200).send(JSON.stringify(data));
        });
    });

    // add user contact
    this.app.post('/principals/me/contacts/', function (req, res, next) {
        var principalId = self.requestParser.extractUserIdFromHeaders(req);
        var domain = self.requestParser.extractDomainFromHeaders(req);
        self.contactManager.addContact(principalId, domain, req.body.username, function (err) {
            if (err) {
                self.logger.error(err);
                res.status(400).send();
                return;
            }
            res.status(200).send();
        });
    });

    // search for a contact in the platform
    this.app.get('/principals/contacts/:query', function (req, res, next) {
        var principalId = self.requestParser.extractUserIdFromHeaders(req);
        var domain = self.requestParser.extractDomainFromHeaders(req);
        self.contactManager.searchForContact(principalId, domain, req.params.query, function (err, data) {
            if (err) {
                self.logger.error(err);
                res.status(400).send();
                return;
            }
            res.status(200).send(JSON.stringify(data));
        });
    });
};

Server.prototype._addWorkgroupsRoutes = function () {
    var self = this;
    this.app.use('/workgroups', this.workgroupSecurityChecker.check.bind(this.workgroupSecurityChecker));
    this.app.post('/workgroups', function (req, res, next) {
            wait.launchFiber(function () {
                moduleContext.req = req;
                self.workgroupDirectoryExpressAdapter.create(req, res, next);
            });
        }
    );

    this.app.delete('/workgroups/*', function (req, res, next) {
        wait.launchFiber(function ()
        {
            self.workgroupDirectoryExpressAdapter.erase(req, res, next);
        });
    });

    this.app.put('/workgroups/*', function (req, res, next) {
        wait.launchFiber(function ()
        {
            self.workgroupDirectoryExpressAdapter.update(req, res, next);
        });
    });

    this.app.get('/workgroups/me', function (req, res, next) {
        wait.launchFiber(function ()
        {
            self.workgroupProviderExpressAdapter.getUserWorkgroups(req, res, next);
        });
    });

    this.app.get('/workgroups/*/members', function (req, res, next) {
        wait.launchFiber(function () {
            self.workgroupProviderExpressAdapter.getWorkgroupMembers(req, res, next);
        });
    });

};

Server.prototype._addChangePasswordRoutes = function () {
    var self = this;
    this.app.use('/changepassword', this.workgroupSecurityChecker.check.bind(this.workgroupSecurityChecker));

    this.app.put('/changepassword', function (req, res, next) {
        wait.launchFiber(function ()
        {
            self.changePasswordExpressAdapter.changePassword(req, res, next);
        });

    });

};


Server.prototype._addSubjectsRoutes = function () {
    var self = this;
    this.app.use('/subjects', this.workgroupSecurityChecker.check.bind(this.workgroupSecurityChecker));

    this.app.get('/subjects/me', function (req, res, next) {
        wait.launchFiber(function ()
        {
            self.subjectProviderExpressAdapter.getUserSubjects(req, res, next);
        });
    });
};

Server.prototype._addDefaultErrorHandler = function () {
    var self = this;
    this.app.use(function defaultErrorHandler(err, req, res, next) {
        self.logger.error("UNHANDLED exception:", err);

        if (err instanceof PrincipalServiceError) {
            // a PrincipalServiceError should never arrive here. If it happens,
            // then it means that some *ExpressAdapter has catched a
            // PrincipalServiceError with a code that it did not expect.
            // THIS SHOULD BE FIXED ASAP
            // THIS SHOULD BE FIXED ASAP
            // THIS SHOULD BE FIXED ASAP
            // THIS SHOULD BE FIXED ASAP
            //
            // We are not returning anything to the client in hopes that
            // the developer or QA will notice a pending request and goes to the
            // correct *ExpressAdapter and add the error code to the switch
            self.logger.error("UNEXPECTED PrincipalServiceError. Not returning anything to the client on purpose. Fix this ASAP:", err);
            return;
        }

        if (settings.throwExceptionsToClient) {
            res.send(err.stack);
            return;
        }
        res.sendStatus(500);
    });
};

Server.prototype._startServer = function () {
    var self = this;
    this._initMongoose();

    if (settings.EYEOS_DEVELOPMENT_MODE) {
        this._addDevelopmentModeMiddlewares();
    }

    baucis.rest('workgroup');
    baucis.rest('membership');

    var principalController = baucis.rest('principal');
    principalController.methods('post put delete', false);

    this.app.use(bodyParser.json());
    this.app.use(this.authenticationChecker.check.bind(this.authenticationChecker));

    this._addPrincipalsRoutes();

    this._addMembershipsRoutes();

    this._addWorkgroupsRoutes();

    this._addChangePasswordRoutes();

    this._addSubjectsRoutes();

    this.app.use('/', baucis());

    this._addDefaultErrorHandler();

    this.server = this.app.listen(settings.server.port);

    this.server.on('listening', function () {
        var httpSettings = {
            hostname: 'localhost',
            port: settings.server.port
        };

        var amqpToHttp = new AmqpToHttp(settings.principalsQueue, httpSettings);
        amqpToHttp.start();
        self.logger.info('Server running...');
    });
};


Server.prototype._allowCrossDomain = function (req, res, next) {
    // Only for development purposes
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

module.exports = Server;
