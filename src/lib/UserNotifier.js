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

var log2out = require('log2out');
var settings = require('./settings');
var userNotification = require('eyeos-usernotification');

function UserNotifier(notificationController) {
    this.logger = log2out.getLogger('UserNotifier');
    this.notificationController = notificationController || new userNotification.NotificationController();
}

UserNotifier.prototype.notify = function(event, userName, workgroupName) {
    var useUserExchange = true;
    var messageType = "filesystem";
    var data = [
        {
            "data": "[{\"path\":\"workgroup:///" + workgroupName + "\",\"type\":\"users\",\"event\":\"" + event.toUpperCase() + "\",\"tenant\":\"eyeos\"}]",
            "from": "system",
            "name": "modified",
            "type": "filesystem"
        }
    ];
    var notification = new userNotification.Notification(messageType, data);

    this.logger.debug('Sending event to user:', userName, 'from workgroup:', workgroupName, 'event:', event);
    this.notificationController.notifyUser(notification, userName, useUserExchange);
};

module.exports = UserNotifier;
