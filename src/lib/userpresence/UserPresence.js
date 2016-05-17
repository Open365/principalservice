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

/**
 * TECH DEBT: we need to port this functionality to a proper presence library
 */

var UserPresenceProvider = require("./UserPresenceProvider");
var settings = require("./Settings");
var log2out = require("log2out");

var UserPresence = function () {
    this.userPresenceProvider = new UserPresenceProvider();
    this.logger = log2out.getLogger("UserPresence");
};

UserPresence.prototype.getAllOnlineUsers = function (callback, onlyReturnUsernames) {
    var self = this;

    self.logger.debug("Getting all online users...");
    this.userPresenceProvider.search({}, settings.provider.fieldsOfInterest, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        self.logger.debug("onlyReturnUsernames:", onlyReturnUsernames);
        if (onlyReturnUsernames) {
            data = collectUsernames(data);
        }

        self.logger.debug("Online users found:", data);
        callback(null, data);
    });
};

UserPresence.prototype.checkOnlineUsers = function (users, callback, userNameAsKey) {
    var self = this;

    // build the query
    var usernames = [];

    users.forEach(function (user) {
        usernames.push({username: user.principalId, domain: user.domain});
    });

    self.logger.debug("Checking presence for the following users:", usernames);

    var query = {$or: usernames};

    this.userPresenceProvider.search(query, settings.provider.fieldsOfInterest, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        self.logger.debug("userNameAsKey:", userNameAsKey);
        if (userNameAsKey) {
            data = collectUsernameKeys(data);
        }

        self.logger.debug("Online users found:", data);
        callback(null, data);
    });
};

function collectUsernameKeys (users) {
    var i;
    var data = {};

    for (i = 0; i < users.length; i++) {
        data[users[i].username] = true;
    }

    return data;
}

module.exports = UserPresence;