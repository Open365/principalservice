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

'use strict';

var BusToHttp = require('eyeos-bustohttp');
var logger = require('log2out').getLogger('systemgroupsapi.BusToHttpInitializer');

var BusToHttpInitializer = function BusToHttpInitializer(settings, injectedHttpToBus) {
    if (!settings) {
        throw new Error('BusToHttpInitializer constructor missing mandatory parameter settings.');
    }

    this.settings = settings;
    this.busToHttp = injectedHttpToBus || new BusToHttp();
};

BusToHttpInitializer.prototype.init = function init() {
    var httpToBusOptions = {
        busHost: this.settings.amqpServer.host,
        busPort: this.settings.amqpServer.port,
        queueName: this.settings.amqpServer.queue
    };
    var httpHost = this.settings.host;
    var httpPort = this.settings.port;
    logger.info('Starting BusToHttp instance for HTTP: %s:%d and AMQP: %j', httpHost, httpPort, httpToBusOptions);
    this.busToHttp.start(httpToBusOptions, httpHost, httpPort);
};

module.exports = BusToHttpInitializer;