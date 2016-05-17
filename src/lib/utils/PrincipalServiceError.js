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

var crypto = require('crypto');

var settings = require('../settings');

'use strict';

var PrincipalServiceError = function (msg, code, data, previous) {
	this.msg = msg;
	this.code = code;
	this.data = data;
	this.previous = previous;
	this.stack = (new Error()).stack;
	this.settings = settings;
};

PrincipalServiceError.prototype = new Error();
PrincipalServiceError.prototype.constructor = PrincipalServiceError;

PrincipalServiceError.prototype.getPublicInfo = function (isInternalError) {
	var pojo;

	if (isInternalError) {
		// limit the amount of info that reach the client.
		// internalCode is present so when the client/qa encounters a server error
		// he/she can report to us the code, and from the code we can know
		// the original error.code
		pojo = {
			code: "INTERNAL_ERROR",
			internalCode: getInternalCode(this.code)
		};
	} else {
		pojo = this.data;
		pojo.code = this.code;
	}

	if (this.settings.throwExceptionsToClient) {
		pojo.stack = this.stack;
	}

	return pojo;
};

function getInternalCode(code) {
	// md5 is broken, but we're using it to only hash a very reduced dictionary
	// so there is no problem with collisions here.
	var hash = crypto.createHash('md5');
	// using base64 to reduce the lenght of the error
	hash.setEncoding('base64');
	hash.write(code);
	hash.end();
	return hash.read();
}



module.exports = PrincipalServiceError;
