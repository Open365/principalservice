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

// Given a user Id, this class returns the full set of study groups it belongs to.
// the groups come populated with all their members too!
// This has been moved to the library (as a test) and is no longer used here.

var SubjectProvider = function(waitFor) {
    this.logger = log2out.getLogger('SubjectProvider');
    this.wait = waitFor || wait;
    this.subjectModel = mongoose.model('workgroup', WorkGroupSchema);
    this.membershipModel = mongoose.model('membership', MembershipSchema);
    this.principalModel = mongoose.model('principal', PrincipalSchema);
};

SubjectProvider.prototype.exec = function(query)
{
    return this.wait.forMethod(query, 'exec');
};
SubjectProvider.prototype.getUserSubjects = function (userId) {
    this.logger.info('Geting subjects for: ', userId);

    var err;

    // TODO: return some error if user does not exist, so the adapter can return 400 Bad Request

    var userMemberships = this.wait.forMethod(this.membershipModel, 'find', {memberId: userId});

    // @TODO: Refactor Needed here, extract the model
    var subjects = [];
    for(var i = 0; i < userMemberships.length; i++) {

        try {
            var subjectModel = this.exec(this.subjectModel.findById(userMemberships[i].groupId).lean());

        } catch(e) {
            this.logger.error('Unable to get subject: ', userMemberships[i].groupId, ' ,Error: ', e);
            err = new PrincipalServiceError(
                "Unable to get subject: " + userMemberships[i].groupId,
                "ERR_MODEL_GET_SUBJECT_BY_ID",
                { subjectId: userMemberships[i].groupId },
                e
            );
            throw err;
        }

        try {
            var assignationsForGroup = this.exec(this.membershipModel.find({ groupId: userMemberships[i].groupId}).lean()) || [];
        } catch(e) {
            this.logger.error('Unable to get subject memberships: ', userMemberships[i].groupId, ' ,Error: ', e);
            err = new PrincipalServiceError(
                "Unable to get subject memberships: " + userMemberships[i].groupId,
                "ERR_MODEL_GET_SUBJECT_MEMBERSHIPS",
                { subjectId: userMemberships[i].groupId },
                e
            );
            throw err;
        }

        var memberIds = assignationsForGroup.map(function(member){
            return member.memberId;
        });
        this.logger.debug("Getting principals ", JSON.stringify(memberIds, null, 4));
        var getUsersQuery = this.principalModel.find({principalId: {$in:memberIds}}, {_id: 0, firstName: 1, lastName: 1, principalId: 1}).lean();
        var members = this.exec(getUsersQuery);
        if(subjectModel && subjectModel.extra_params.tags.indexOf('subject') > -1) {
            var subject = {
                id: subjectModel._id,
                name: subjectModel.name,
                description: subjectModel.description,
                extra_params: subjectModel.extra_params,
                members: members
            };
            subjects.push(subject);
        }
    }
    return subjects;
};


module.exports = SubjectProvider;
