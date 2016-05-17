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

// Is required on WorkgroupProvider, but it is not used.
var PolicySet = function (claimCollection) {
	this.claims = claimCollection;
	this.logger = log2out.getLogger('PolicySet');
};

PolicySet.prototype.getAdministratedGroups = function() {
	var workgroupsIds = [];
	for(var a = 0; a < this.claims.length; a++) {
		var parts = this.claims[a].split('.');
		if (parts[1] === 'group' && parts[3] === 'administrator') {
			workgroupsIds.push(parts[2]);
		}
	}
	return workgroupsIds;
};

module.exports = PolicySet;
