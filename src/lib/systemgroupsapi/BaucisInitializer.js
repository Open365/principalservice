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

var logger = require('log2out').getLogger('BaucisInitializer');

var BaucisInitializer = function BaucisInitializer(settings, injectedBaucis, injectedMongoose) {
    if (!settings) {
        throw new Error('BaucisInitializer constructor missing mandatory parameter settings.');
    }

    this.settings = settings;
    this.baucis = injectedBaucis || require('baucis');
    this.mongoose = injectedMongoose || require('mongoose');
};

BaucisInitializer.prototype.init = function init() {
    function logInitialized(error, inDb){
        if (error) {
            var errorMsg = 'Error initializing systemGroup:' + error.message;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        logger.info('systemGroup is OK in MongoDB:', inDb);
    }
    // initialize mongoose connection, model and ensure EVERYONE sysgroup is OK
    if (this.mongoose.connection._readyState === 0) {
		this.mongoose.connect(this.settings.mongoUrl);
	}
    var eyeos_principal = require('eyeos-principal');
    var SystemGroupSchema = eyeos_principal.SystemGroupSchema(this.mongoose);
    eyeos_principal.PrincipalSchema(this.mongoose).getModel();
    SystemGroupSchema.lazyInitEveryoneSystemGroup(logInitialized);
    SystemGroupSchema.lazyInitAdministratorSystemGroup(logInitialized);
    this.baucis.rest('SystemGroup');

    eyeos_principal.PrincipalSystemGroupAssignationSchema(this.mongoose);
    this.baucis.rest('PrincipalSystemGroupAssignation');

    return this.baucis;
};

module.exports = BaucisInitializer;
