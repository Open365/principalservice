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

var wait = require('wait.for');
var mongoose = require('mongoose');
var WorkGroupSchema = require('./models/WorkGroupSchema');
var MembershipSchema = require('./models/MembershipSchema');
var PrincipalSchema = require('./models/PrincipalSchema');
var settings = require('./settings.js');
var log2out = require('log2out');
var PolicySet = require('./PolicySet');
var PrincipalServiceError = require('./utils/PrincipalServiceError');

// Given a user Id, this class returns the full set of groups it belongs to.
// the groups come populated with all their members too!
// This has been moved to the library (as a test) and is no longer used here.

var WorkgroupProvider = function(waitFor) {
	this.logger = log2out.getLogger('WorkgroupProvider');
	this.wait = waitFor || wait;
	this.workgroupModel = mongoose.model('workgroup', WorkGroupSchema);
	this.membershipModel = mongoose.model('membership', MembershipSchema);
	this.principalModel = mongoose.model('principal', PrincipalSchema);
};

WorkgroupProvider.prototype.exec = function(query)
{
    return this.wait.forMethod(query, 'exec');
};
WorkgroupProvider.prototype.getUserWorkgroups = function (userId) {
	this.logger.info('Geting workgroups for: ', userId);

	var err;

	// TODO: return some error if user does not exist, so the adapter can return 400 Bad Request

    var userMemberships = this.wait.forMethod(this.membershipModel, 'find', {memberId: userId});

	// @TODO: Refactor Needed here, extract the model
	var workgroups = [];
	for(var i = 0; i < userMemberships.length; i++) {

		try {
            var queryFindById = this.workgroupModel.findById(userMemberships[i].groupId).lean();
			var workgroupModel = this.exec(queryFindById);

		} catch(e) {
			this.logger.error('Unable to get workgroup: ', userMemberships[i].groupId, ' ,Error: ', e);
			err = new PrincipalServiceError(
				"Unable to get workgroup: " + userMemberships[i].groupId,
				"ERR_MODEL_GET_WORKGROUP_BY_ID",
				{ workgroupId: userMemberships[i].groupId },
				e
			);
			throw err;
		}

		try {
            var queryFind = this.membershipModel.find({ groupId: userMemberships[i].groupId}).lean();
			var assignationsForGroup = this.exec(queryFind) || [];
		} catch(e) {
			this.logger.error('Unable to get workgroup memberships: ', userMemberships[i].groupId, ' ,Error: ', e);
			err = new PrincipalServiceError(
				"Unable to get workgroup memberships: " + userMemberships[i].groupId,
				"ERR_MODEL_GET_WORKGROUP_MEMBERSHIPS",
				{ workgroupId: userMemberships[i].groupId },
				e
			);
			throw err;
		}
		var memberIds;
		memberIds = assignationsForGroup.map(function(member){
			return member.memberId;
		});
		this.logger.debug("Getting principals ", JSON.stringify(memberIds, null, 4));
		var getUsersQuery = this.principalModel.find({principalId: {$in:memberIds}}, {_id: 0, firstName: 1, lastName: 1, principalId: 1}).lean();
		var members = this.exec(getUsersQuery);
		if(workgroupModel) {
			var workgroup = {
				id: workgroupModel._id,
				name: workgroupModel.name,
				description: workgroupModel.description,
				extra_params: workgroupModel.extra_params,
				members: members
			};
			workgroups.push(workgroup);
		}
	}
	return workgroups;
};


WorkgroupProvider.prototype.getWorkgroupMembers = function (groupId) {

	try {
		var queryFind = this.membershipModel.find({groupId: groupId}).lean();
		var assignationsForGroup = this.exec(queryFind) || [];
	} catch (e) {
		this.logger.error('Unable to get workgroup memberships: ', groupId, ' ,Error: ', e);
		err = new PrincipalServiceError(
			"Unable to get workgroup memberships: " + groupId,
			"ERR_MODEL_GET_WORKGROUP_MEMBERSHIPS",
			{workgroupId: groupId},
			e
		);
		throw err;
	}

	var memberIds = assignationsForGroup.map(function (member) {
		return member.memberId;
	});

	var getUsersQuery = this.principalModel.find({principalId: {$in: memberIds}}).lean();
	var members = this.exec(getUsersQuery);

	return members.map(function (princ) {
		var role = princ.permissions.reduce(function (valorPrevio, valorActual) {
			return valorActual.search(groupId) > -1 ? valorActual : valorPrevio;
		}, '');
		return {
			id: princ.principalId,
			lastName: princ.lastName,
			firstName: princ.firstName,
			role: role
		};
	});
};

module.exports = WorkgroupProvider;
