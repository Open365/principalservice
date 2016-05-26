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

var settings = require('./settings');
var ldap = require('ldapjs');
var crypto = require('crypto');
var eyeos_principal = require('eyeos-principal');
var mongoose = require('mongoose');
var logger = require('log2out').getLogger('ChangePasswordProvider');

var ChangePasswordExpressProvider = function (client, principalModel) {

    this.ldapClient = client || ldap.createClient({url: settings.ldap.host});
    this.principalModel = principalModel;

};

ChangePasswordExpressProvider.prototype._close = function() {
    this.ldapClient.unbind();
    this.ldapClient = null;
};

ChangePasswordExpressProvider.prototype._updateChangePasswordField = function(username,domain, cb) {

    var PrincipalSchema = eyeos_principal.PrincipalSchema(mongoose);
    var PrincipalModel = this.principalModel || PrincipalSchema.getModel();
    var query = {principalId: username, domain: domain};

    PrincipalModel.findOneAndUpdate(query, {mustChangePassword: false}, function (err, principal) {
        cb(err);
    });


};

ChangePasswordExpressProvider.prototype._modifyPassword = function(data,cb) {

    var self  = this;

    var md5 = crypto.createHash('md5').update(data.newpassword, 'utf8').digest('base64');

    var changeData = new ldap.Change({
        operation: 'replace',
        modification: { userPassword: '{md5}'+md5 }
    });

    var ldapName = constructLdapName(data);
    this.ldapClient.modify(ldapName, changeData, function(err) {
        if(err){
            if (err.code===50) {
                cb(401, err.message);
            } else {
                logger.error('_modifyPassword error: ', err);
                cb(500, err.message);
            }
        } else {
            self._updateChangePasswordField(data.username, data.domain, function(err) {
                if(err) {
                    logger.error('_modifyPassword updating ldap error: ', err);
                    cb(500, err.message);
                } else {
                    cb(200,'Password changed for user: ', data.username);
                }
            });
        }
        self._close();

    });
};

ChangePasswordExpressProvider.prototype._isPasswordValid = function(password) {
    // 8 characters length minimum
    return (password.length >= 8);
};

ChangePasswordExpressProvider.prototype.changePassword = function(data, cb) {
    var self = this;

    if (this.ldapClient === null) {
        this.ldapClient = ldap.createClient({url: settings.ldap.host});
    }

    if (data.username === data.newpassword) {
        cb(400,"Password can't be the same as the username");
        return;
    }

    var ldapName = constructLdapName(data);
	this.ldapClient.bind(ldapName, data.currentpassword, function(err) {
        if (err) {
            self._close();
            if (err.code === 49) {
                cb(401,"Current password doesn't match");
            } else {
                logger.error('changePassword  ldap error: ', err);
                cb(500, err.message);
            }
            return;
        }

        if (!self._isPasswordValid(data.newpassword)) {
            self._close();
            cb(400,'Error checking password rules');
            return;
        }

        self._modifyPassword(data,function(code, message) {
            cb(code, message);
        });


    });
};

function constructLdapName (data) {
    return 'cn=' + data.username + '@' + data.domain + ',ou=People, dc=eyeos,dc=com';
}

module.exports = ChangePasswordExpressProvider;
