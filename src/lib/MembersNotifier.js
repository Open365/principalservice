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
var StompClient = require('./utils/StompClient');
var log2out = require('log2out');
var userNotification = require('eyeos-usernotification');

// Sends notifications to users when their workgroup state changes.
// Should be moved to the library, but server.js breaks the abstraction and calls it directly.


// Should use eyeos-consume-service to send the notifications?
// Should the user know the difference between being removed from a group or
// the group being deleted?

var MembersNotifier = function(notificationController) {
    this.logger = log2out.getLogger('MembersNotifier');
    this.notificationController = notificationController || new userNotification.NotificationController();
};

MembersNotifier.prototype.workgroupDeleted = function(memberId, workgroupId, injectedStompClient) {
    this.logger.info('Notifying workgroupDeleted:', workgroupId, 'to member:', memberId);
    this._notify('workgroupDeleted', memberId, workgroupId, injectedStompClient);
};

MembersNotifier.prototype.userRemovedFromWorkgroup = function(memberId, workgroupId, injectedStompClient) {
    this.logger.info('Notifying userRemovedFromWorkgroup:', workgroupId, 'to member:', memberId);
    this._notify('userRemovedFromWorkgroup', memberId, workgroupId, injectedStompClient);
};

MembersNotifier.prototype._notify = function(type, memberId, workgroupId) {
    var useUserExchange = true;
    var data = {
        workgroupId: workgroupId
    };
    var notification = new userNotification.Notification(type, data);

    this.notificationController.notifyUser(notification, memberId, useUserExchange);
};


module.exports = MembersNotifier;
