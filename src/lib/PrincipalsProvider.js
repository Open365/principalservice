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
var log2out = require('log2out');
var PrincipalSchema = require('eyeos-principal').PrincipalSchema(mongoose);

function PrincipalsProvider (customPrincipalModel) {
	this.customPrincipalModel = customPrincipalModel;
	this.logger = log2out.getLogger('PrincipalsProvider');
}

PrincipalsProvider.prototype.put = function (principalId, domain, data, cb) {
	var principalModel = this.customPrincipalModel || mongoose.model('principal');

	this.get(principalId, domain, function(err, principal) {
		if (err) {
			return cb(err);
		}

		Object.keys(data).forEach(function (attr) {
			principal[attr] = data[attr];
		});

		principal.save(function (err, princ) {
			if (err) {
				return cb(err);
			}
			cb(err, princ);
		});
	});
};

PrincipalsProvider.prototype.get = function (principalId, domain, cb) {
	var principalModel = this.customPrincipalModel || mongoose.model('principal');

	principalModel.findOne({principalId: principalId, domain: domain}, function (err, principal) {
		if (err) {
			return cb(err);
		}

		cb(err, principal);
	});
};

PrincipalsProvider.prototype.search = function (query, limit, sort, cb) {
	var principalModel = this.customPrincipalModel || mongoose.model('principal');

	principalModel.find(query)
		.lean()
		.sort(sort)
		.limit(limit)
 		.exec(function (err, results) {
			if (err) {
				cb(err);
				return;
			}
			cb(null, results);
		});
};

PrincipalsProvider.prototype.push = function (principalId, domain, data, cb) {
	var self = this;
	var principalModel = PrincipalSchema.getModel();

	var query = {principalId:principalId, domain:domain};
	var update = {$addToSet:data};
	var options = {};

	self.logger.debug('query:', query);
	self.logger.debug('update:', update);
	self.logger.debug('options:', options);

	principalModel.update(query, update, options, function (err, numRows, raw) {
		self.logger.debug('Mongo response:', raw);
		if (err) {
			cb(err);
			return;
		}
		self.logger.debug('Num rows affected:', numRows);
		cb();
	});
};

PrincipalsProvider.prototype.getAttribute = function (principalId, domain, attribute, cb) {
	var self = this;
	var principalModel = PrincipalSchema.getModel();

	var query = {principalId: principalId, domain: domain};

	principalModel.find(query, attribute, function (err, results) {
		if (err) {
			cb(err);
			return;
		}
		cb(null, results);
	});
};

module.exports = PrincipalsProvider;
