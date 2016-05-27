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

var sinon = require('sinon');
var assert = require('chai').assert;
var Hippie4eyeos = require('eyeos-hippie');

var hippie4Eyeos = new Hippie4eyeos();

var skipDestructive = process.env.SKIP_DESTRUCTIVE_TESTS !== undefined;

suite('Principal service component tests', function () {
	var timeout = this._timeout || 2000;

	var systemGroupsUrl = '/systemgroups/v1/systemgroups';
	var principalsUrl = '/principalService/v1/principals';
	var workgroupsUrl = '/principalService/v1/workgroups';
	var changePassword = '/principalService/v1/changepassword';
	var me = principalsUrl+'/me';
	var everyoneGroupUrl = systemGroupsUrl + '/EVERYONE';
	var administratorGroupUrl = systemGroupsUrl + '/ADMINISTRATOR';

	var newWorkgroupId;

	var data = {
		contentType: 'application/json'
	};

	suiteSetup(function (done) {
		hippie4Eyeos.login(done, 'eyeos', 'eyeos');
	});

	function basicRequestWithCardAndSignatureParsed (data) {
		return hippie4Eyeos.basicRequestWithCardAndSignature(data)
			.timeout(timeout)
			.parser(function(body, fn) {
				fn(null, body);
			})
			.header('Accept', '*/*')
			.header('Cache-Control', 'no-cache')
			.header('Accept-Encoding', 'gzip, deflate')
			.header('Accept-Language', 'en-US,en;q=0.8,ca;q=0.6');
	}

	suite("#principals api", function () {
		//HA PASS
		test("#GET should return status 200 when GET principals with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed()
				.get(principalsUrl)
				.expectStatus(200)
				.expectBody(/"principalId":/)
				.expectBody(/"lastName":/)
				.expectBody(/"firstName":/)
				.expectBody(/"systemGroups":/)
				.end(done);
		});
	});

	suite("#changepassword api", function () {
		//HA PASS
		test("#changepassword should return status 401 when PUT changepassword with valid card and signature and invalid current password", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.put(changePassword)
				.send({
					username: "eyeos",
					currentpass: "invalidCurrentPassword",
					newpass: "Newpassword1"
				})
				.expectStatus(401)
				.end(done);
		});
		//HA PASS
		test("#changepassword should return status 400 when PUT changepassword with valid card and signature and invalid new password", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.put(changePassword)
				.send({
					username: "eyeos",
					currentpass: "eyeos",
					newpass: "aaa"
				})
				.expectStatus(400)
				.end(done);
		});

		if(skipDestructive) {
			//HA PASS
			test("#changepassword should return status 200 when PUT changepassword with valid card and signature and valid data", function (done) {
				basicRequestWithCardAndSignatureParsed(data)
					.put(changePassword)
					.send({
						username: "eyeos",
						currentpass: "eyeos",
						newpass: "Newpassword1"
					})
					.expectStatus(200)
					.end(done);
			});
		}


		suite('#changepassword bugs', function () {
			var username = 'eyeos';
			suiteSetup(function (done) {
				function changePasswordForUser() {
					basicRequestWithCardAndSignatureParsed(data)
						.put(changePassword)
						.send({
							username: username,
							currentpass: "eyeos",
							newpass: "Newpassword1"
						})
						.end(function (err) {
							if (err) {
								throw err;
							}
							hippie4Eyeos.login(done, username, 'eyeos', null, 'anotherdomain.com');

						});
				}
				hippie4Eyeos.login(changePasswordForUser, username, 'eyeos', null, 'atestdomain.com');

			});

			test("#login after another user (with same name but different domain) changes his password, should continue seeing the change password form", function (done){
				/*
					1 - user A logs in
					2 - user A changes password
					3 - user B logs in
					4 - user B should see CHANGE PASSWORD FORM
				*/
				basicRequestWithCardAndSignatureParsed(data)
					.get(me)
					.expectStatus(200)
					.expectBody(/"mustChangePassword":true/)
					.end(done);
			});
		});

	});

	suite("#systemgroups api", function () {
		//@TODO: test me
		test('#unauthorized request should return status 401 when requesting without a valid card and signature', function (done) {
			hippie4Eyeos.basicRequest()
				.parser(function(body, fn) {
					fn(null, body);
				})
				.get(systemGroupsUrl)
				.expectStatus(401)
				.end(done);
		});
		//@TODO: test me
		test("#GET should return status 200 when GET systemgroups with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed()
				.get(systemGroupsUrl)
				.expectStatus(200)
				.end(done);
		});
		// @TODO: test me
		test("#POST should return status 403 when POST systemgroup EVERYONE with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.post(systemGroupsUrl)
				.send({
					"_id": "EVERYONE",
					"name": "A new systemgroup",
					"permissions": []
				})
				.expectStatus(403)
				.end(done);
		});
		// @TODO:_test me
		test("#POST should return status 400 when POST systemgroup ADMINISTRATOR with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.post(systemGroupsUrl)
				.send({
					"_id": "ADMINISTRATOR",
					"name": "A new systemgroup",
					"permissions": []
				})
				.expectStatus(403)
				.end(done);
		});
		// @TODO: test me
		test("#POST should return status 201 when POST systemgroup TEST with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.post(systemGroupsUrl)
				.send({
					"_id": "TEST",
					"name": "A new systemgroup",
					"permissions": []
				})
				.expectStatus(201)
				.end(done);
		});
		// @TODO: test me
		test("#PUT should return status 200 when PUT systemgroup EVERYONE with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.put(everyoneGroupUrl)
				.expectStatus(200)
				.end(done);
		});
		// @TODO: test me
		test("#PUT should return status 403 when PUT systemgroup ADMINISTRATOR with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.put(administratorGroupUrl)
				.expectStatus(403)
				.end(done);
		});
		// @TODO: test me
		test("#DELETE should return status 403 when DELETE systemgroup EVERYONE with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.del(everyoneGroupUrl)
				.expectStatus(403)
				.end(done);
		});
		// @TODO: test me
		test("#DELETE should return status 403 when DELETE systemgroup ADMINISTRATOR with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.del(administratorGroupUrl)
				.expectStatus(403)
				.end(done);
		});
		// @TODO: test me
		test("#DELETE should return status 200 when DELETE systemgroup that exists with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.del(systemGroupsUrl + '/TEST')
				.expectStatus(200)
				.end(done);
		});
		// @TODO: test me
		test("#DELETE should return status 404 when DELETE systemgroup that does not exist with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.del(systemGroupsUrl + '/TEST')
				.expectStatus(404)
				.end(done);
		});
	});

	suite("#workgroups api", function () {
		//HA PASS
		test("#POST should return status 201 when POST workgroups with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.parser(function(body, fn) {
					var data = JSON.parse(body);
					newWorkgroupId = data._id;
					fn(null, body);
				})
				.post(workgroupsUrl)
				.send({
					name: "component-test-group",
					description: "Component test group"
				})
				.expectStatus(201)
				.end(done);
		});
		//HA PASS
		test("#POST should return status 400 when POST workgroups that exists with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.post(workgroupsUrl)
				.send({
					name: "component-test-group",
					description: "Component test group"
				})
				.expectStatus(400)
				.end(done);
		});
		//HA PASS
		test("#GET should return status 200 when GET workgroups/me with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed()
				.get(workgroupsUrl+'/me')
				.expectStatus(200)
				.expectBody(/"id":/)
				.expectBody(/"name":/)
				.expectBody(/"description":/)
				.expectBody(/"members":/)
				.end(done);
		});
		//HA PASS
		test("#GET should return status 200 when GET workgroups with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed()
				.get(workgroupsUrl)
				.expectStatus(200)
				.end(done);
		});
		//HA PASS
		test("#DELETE should return status 200 when DELETE workgroups that exists with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.del(workgroupsUrl + '/' + newWorkgroupId)
				.expectStatus(200)
				.end(done);
		});
		//HA PASS
		test("#DELETE should return status 404 when DELETE workgroups that does not exist with valid card and signature", function (done) {
			basicRequestWithCardAndSignatureParsed(data)
				.del(workgroupsUrl + '/' + newWorkgroupId)
				.expectStatus(404)
				.end(done);
		});
	});
});
