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

var mongoose = require('mongoose');
var UserPresenceSchema = require('./UserPresenceSchema');
var log2out = require('log2out');

var UserPresenceProvider = function () {
    this.logger = log2out.getLogger("UserPresenceProvider");
    this.model = UserPresenceSchema(mongoose).getModel();
};

UserPresenceProvider.prototype.search = function (query, fields, callback) {
    this.model.find(query, fields)
        .lean()
        .exec(function (err, results) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, results);
        });
};

module.exports = UserPresenceProvider;