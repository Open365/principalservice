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

var logger = require('log2out').getLogger('ChangePasswordExpressAdapter');
var ChangePasswordProvider = require('./ChangePasswordProvider');
var ChangePasswordPostProcessor = require('./ChangePasswordPostProcessor');
var RequestParser = require('./utils/RequestParser');

var ChangePasswordExpressAdapter = function (changePasswordProvider, changePasswordPostProcessor) {
    this.changePasswordProvider = changePasswordProvider || new ChangePasswordProvider();
    this.postProcessor = changePasswordPostProcessor || new ChangePasswordPostProcessor();
    this.requestParser = new RequestParser();
    this.logger = logger;
};


ChangePasswordExpressAdapter.prototype.changePassword= function (req, res, next) {
    var userData = {};

    userData.username = this.requestParser.extractUserIdFromHeaders(req);
    userData.card = this.requestParser.extractCardFromHeaders(req);
    userData.currentpassword = req.body.currentpass;
    userData.newpassword = req.body.newpass;
    userData.domain = userData.card.domain;

    if (typeof userData.currentpassword === 'undefined' || typeof userData.newpassword === 'undefined') {
        res.sendStatus(400);
        return;
    }

    var self = this;
    this.changePasswordProvider.changePassword(userData, function (code, info) {
        if ( info ) {
            if ( code > 200 ) {
                logger.error(info);
            } else {
                logger.info(info);
            }
        }

        self.postProcessor.process({
            username: userData.username,
            newPassword: userData.newpassword,
            oldPassword: userData.currentpassword,
            card: userData.card
        });
        res.sendStatus(code);
    });
};

module.exports = ChangePasswordExpressAdapter;
