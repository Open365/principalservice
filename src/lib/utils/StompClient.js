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

//Class copied from vdi-service, we will remove duplicity when we do the techdebt

var log2out = require('log2out');
var stomp = require('eyeos-stomp');

var StompClient = function (settings, client) {
    this.settings = settings;
    this.client = client || new stomp.Stomp(this.settings);
    this.logger = log2out.getLogger('StompClient');
};

StompClient.prototype.send = function (destination, message) {
    this.logger.debug('.send to: ' + destination + ' msg:', message);

    this.client.connect();

    var self = this;
    this.client.on('connected', function () {
        self.client.send({
            destination: destination,
            body: JSON.stringify(message)
        });
        self.client.disconnect();
    });

};

module.exports = StompClient;