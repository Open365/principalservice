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

var settings = require('./settings.js');
var log2out = require('log2out');
var express = require('express');
var heapdump = require('heapdump');
var _ = require("underscore");

var TestabilityServer = function() {
    this.logger = log2out.getLogger('TestabilityServer');
    this.testabilityApp = express();
};

TestabilityServer.prototype.start = function() {

    function actOverGroups(req, res, groupCallback)
    {
        var groups = req.params.groups.split(",");
        var rfr = require('rfr');
        var PrincipalProvider = rfr('/node_modules/eyeos-auth/src/lib/PrincipalProvider.js');
        var provider = new PrincipalProvider();
        var userId = req.params.userId;
        provider.getPrincipal(userId, function (principal)
        {
            groups.forEach(groupCallback(principal));
            principal.save();
            res.send(200);
        });
    }

    this.testabilityApp.post("/permission/:userId/:groups", function (req, res) {
        actOverGroups(req, res, function (principal) {
            return function (groupId) {
                var groupPermission = "eyeos.group." + groupId + ".administrator";
                if (!_.contains(principal.permissions, groupPermission)) {
                    principal.permissions.push(groupPermission);
                }
            };
        });
    });
    this.testabilityApp.delete("/permission/:userId/:groups", function (req, res) {
        actOverGroups(req, res, function (principal) {
            return function (groupId) {
                var groupPermission = "eyeos.group." + groupId + ".administrator";
                principal.permissions=_.without(principal.permissions, _.findWhere(principal.permissions, groupPermission));
            };
        });
    });
    this.testabilityApp.get("/heapdump", function (req, res) {
        heapdump.writeSnapshot('./' + Date.now() + '.heapsnapshot');
        res.end();
    });
    this.testabilityApp.get("/gc", function (req, res) {
        global.gc();
        res.end();
    });

    this.testabilityApp.listen(14100, function () {
        var host = 'localhost';
        var port = settings.server.port;
        console.log('API for test at http://%s:%s', host, port);
    });
};

module.exports = TestabilityServer;
