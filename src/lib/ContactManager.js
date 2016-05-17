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

var PrincipalsProvider =  require('./PrincipalsProvider');
var UserPresence = require('./userpresence/UserPresence');
var settings = require("./settings");
var log2out = require('log2out');

var ContactManager = function (principalsProvider, userPresence) {
    this.principalsProvider = principalsProvider || new PrincipalsProvider();
    this.userPresence = userPresence || new UserPresence();
    this.logger = log2out.getLogger('ContactManager');
};

ContactManager.prototype.searchForContact = function (principalId, domain, criteria, callback) {
    var self = this;

    // 1. build the query
    var query = this._buildSearchForContactQuery(principalId, domain, criteria);
    var limit = settings.contacts.searchForContactLimit;
    var sort = "firstname lastname";

    // 2. search for all matching principals
    this.principalsProvider.search(query, limit, sort, function (err, usersFound) {
        if (err) {
            callback(err);
            return;
        }

        if (usersFound.length == 0) {
            callback(null, usersFound);
            return
        }

        self.logger.debug("Contacts that match query:", usersFound);

        // 3. check if matching users are online
        self.userPresence.checkOnlineUsers(usersFound, function (err, onlineUsers) {
            if (err) {
                callback(err);
                return;
            }

            self._setPresenceForContacts(usersFound, onlineUsers);
            callback(null, usersFound);
        }, true);
    });
};

ContactManager.prototype.addContact = function (principalId, domain, contact, callback) {
    var self = this;
    self.logger.debug("Adding contact: " + contact + " to contact list for principal: " + principalId + "@" + domain);
    this.principalsProvider.push(principalId, domain, {contacts:contact}, function (err) {
        if (err) {
            callback(err);
            return;
        }
        self.logger.debug("Contact successfully added");
        callback();
    });

};

ContactManager.prototype.getContactsThatHaveMe = function(principalId, domain, callback) {
    var self = this;
    var query = {
        contacts: {
            $in: [
                principalId
            ]
        },
        domain: domain
    };
    this.logger.debug("Getting contacts that have as contact the principal: " + principalId);
    this.principalsProvider.search(query, null, null, function(err, usersFound) {
        if (err) {
            callback(err);
            return;
        }

        if (usersFound.length == 0) {
            callback(null, usersFound);
            return
        }

        self.logger.debug("Contacts collected:", usersFound);
        self.userPresence.checkOnlineUsers(usersFound, function (err, onlineUsers) {
            if (err) {
                callback(err);
                return;
            }

            self._setPresenceForContacts(usersFound, onlineUsers);
            callback(null, usersFound);
        }, true);
    });
};

ContactManager.prototype.getContacts = function (principalId, domain, callback) {
    var self = this;
    self.logger.debug("Getting contacts for principal: " + principalId + " within domain: " + domain);
    this.principalsProvider.getAttribute(principalId, domain, "contacts", function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        self.logger.debug("Contacts found:", data);

        if (!data || !data.length || !data[0]) {
            callback(new Error("Unexpected parameters"));
            return;
        }

        var contacts = [];

        if (data[0].contacts.length < 1) {
            self.logger.debug("No contacts found.  Guess nobody likes you :( ");
            callback(null, contacts);
            return;
        }

        self.logger.debug("Collecting contacts information...");

        // build the query
        data[0].contacts.forEach(function (key, val) {
            contacts.push({principalId: key});
        });

        var query = {
            $and: [
                {domain: domain},
                {$or: contacts}
            ]
        };

        self.principalsProvider.search(query, null, null, function (err, usersFound) {
            if (err) {
                callback(err);
                return;
            }

            if (usersFound.length == 0) {
                callback(null, usersFound);
                return
            }

            self.logger.debug("Contacts collected:", usersFound);
            self.userPresence.checkOnlineUsers(usersFound, function (err, onlineUsers) {
                if (err) {
                    callback(err);
                    return;
                }

                self._setPresenceForContacts(usersFound, onlineUsers);
                callback(null, usersFound);
            }, true);
        });
    });
};

ContactManager.prototype._buildSearchForContactQuery = function (principalId, domain, criteria) {
    var query;
    var regex = new RegExp("^" + criteria);

    this.logger.debug("Extracting principal domain:", domain);
    this.logger.debug("Searching for contact with criteria: '" + criteria + "' within domain: '" + domain + "'");
    query = {
        $and: [
            {domain: domain},
            {searchText: {$regex: regex, $options:"i"}}
        ]
    };

    return query;
};

ContactManager.prototype._setPresenceForContacts = function (contacts, online) {
    var i;

    for (i = 0; i < contacts.length; i++) {
        contacts[i].online = online.hasOwnProperty(contacts[i].principalId);
    }
};

module.exports = ContactManager;
