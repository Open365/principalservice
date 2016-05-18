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

var environment = process.env;

var EYEOS_DEVELOPMENT_MODE = (environment.EYEOS_DEVELOPMENT_MODE === 'true');

var Settings = {
	server: {
		port: 4100
	},

	ldap: {
		host: environment.EYEOS_PRINCIPALSERVICE_LDAP_HOST || 'ldap://ldap.service.consul'
	},

	mongo: {
		host: environment.EYEOS_PRINCIPALSERVICE_MONGO_HOST || 'mongo.service.consul',
		port: environment.EYEOS_PRINCIPALSERVICE_MONGO_PORT || 27017,
		db: environment.EYEOS_PRINCIPALSERVICE_MONGO_DB || 'eyeos'
	},
	principalsQueue: {
		type: "amqp",
		hosts: environment.EYEOS_PRINCIPALSERVICE_PRINCIPALSQUEUE_HOSTS || 'rabbit.service.consul:5672', //'192.168.7.39',
		username: environment.EYEOS_BUS_MASTER_USER || 'guest',
		password: environment.EYEOS_BUS_MASTER_PASSWD || 'guest',
		queue: {
			name: 'principalService.v1',
			durable: true,
			exclusive: false,
			autoDelete: false
		},
		subscription: {
			ack: true,
			prefetchCount: parseInt(environment.EYEOS_PRINCIPALSERVICE_PRINCIPALSQUEUE_PREFETCH_COUNT, 10) || 0
		}
	},
	mountPoint: {
		path: environment.EYEOS_PRINCIPALSERVICE_MOUNTPOINT_PATH || '/mnt/rawFS'
	},
	PermissionsQueue: {
		 url: environment.EYEOS_PRINCIPALSERVICE_PERMISSIONSQUEUE_URL || 'amqp://permissions/v1/principals/',
		type: environment.EYEOS_PRINCIPALSERVICE_PERMISSIONSQUEUE_TYPE || "amqp",
		host: environment.EYEOS_PRINCIPALSERVICE_PERMISSIONSQUEUE_HOST || 'rabbit.service.consul',
		port: environment.EYEOS_PRINCIPALSERVICE_PERMISSIONSQUEUE_PORT || 5672,
		login: environment.EYEOS_BUS_MASTER_USER || 'guest',
		password: environment.EYEOS_BUS_MASTER_PASSWD || 'guest',
		options: {
			durable: true,
			exclusive: false,
			autoDelete:false
		}
	},
	WorkgroupEventsQueue: {
		url: environment.EYEOS_PRINCIPALSERVICE_WORKGROUPEVENTSQUEUE_URL || 'amqp://workgroups/v1/workgroups',
		type: environment.EYEOS_PRINCIPALSERVICE_WORKGROUPEVENTSQUEUE_TYPE || "amqp",
		host: environment.EYEOS_PRINCIPALSERVICE_WORKGROUPEVENTSQUEUE_HOST || 'rabbit.service.consul',
		port: environment.EYEOS_PRINCIPALSERVICE_WORKGROUPEVENTSQUEUE_PORT || 5672,
		login: environment.EYEOS_BUS_MASTER_USER || 'guest',
		password: environment.EYEOS_BUS_MASTER_PASSWD || 'guest',
		options: {
			durable: true,
			exclusive: false,
			autoDelete:false
		}
	},
	userQueue: {
		host: environment.EYEOS_PRINCIPALSERVICE_USERQUEUE_HOST || 'rabbit.service.consul',
		port: environment.EYEOS_PRINCIPALSERVICE_USERQUEUE_PORT || 61613,
		login: environment.EYEOS_BUS_MASTER_USER || 'guest',
		passcode: environment.EYEOS_BUS_MASTER_PASSWD || 'guest'
	},
	throwExceptionsToClient: environment.EYEOS_PRINCIPALSERVICE_THROW_EXCEPTIONS_TO_CLIENT === "true" || false,
	systemGroups: {
		host: environment.EYEOS_SYSGROUP_SERVICE_HTTP_HOST || '127.0.0.1',
		port: +environment.EYEOS_SYSGROUP_SERVICE_HTTP_PORT || 9246,
		path: environment.EYEOS_SYSGROUP_SERVICE_HTTP_PATH || '/systemgroups/v1',
		mongoUrl: environment.EYEOS_SYSGROUP_SERVICE_MONGOURL || 'mongodb://mongo.service.consul:27017/eyeos',
		amqpServer: {
			host:     environment.EYEOS_SYSGROUP_SERVICE_AMQPSERVER_HOST || 'rabbit.service.consul',
			port:     environment.EYEOS_SYSGROUP_SERVICE_AMQPSERVER_PORT || 5672,
			queue:    environment.EYEOS_SYSGROUP_SERVICE_AMQPSERVER_QUEUE || 'systemgroups.v1',
			login:    environment.EYEOS_BUS_MASTER_USER || 'guest',
			password: environment.EYEOS_BUS_MASTER_PASSWD || 'guest'
		},
		EYEOS_DEVELOPMENT_MODE: EYEOS_DEVELOPMENT_MODE
	},
	messages: {
		WorkgroupCreatedMessage: {
			method: undefined,
			target: undefined
		}
	},
	userEvents: {
		exchange: {
			postUrl: environment.EYEOS_PRINCIPALSERVICE_CHANGEPASSWORD_EXCH_URL || 'amqp.exchange.passwordChanged://presence/v1/userEvent/passwordChanged/',
			type: environment.EYEOS_PRINCIPALSERVICE_CHANGEPASSWORD_EXCH_TYPE || "amqp",
			host: environment.EYEOS_PRINCIPALSERVICE_CHANGEPASSWORD_EXCH_HOST || 'rabbit.service.consul',
			port: environment.EYEOS_PRINCIPALSERVICE_CHANGEPASSWORD_EXCH_PORT || 5672,
			login: environment.EYEOS_BUS_MASTER_USER || 'guest',
			password: environment.EYEOS_BUS_MASTER_PASSWD || 'guest',
			options:  {
				durable: true,
				exclusive: false,
				autoDelete: true
			}
		},
		crypto: {
			type: 'rsa',
			rsa: {
				public: __dirname + "/rsa-keys/key.pub"
			}
		}
	},
	contacts: {
		searchForContactLimit: environment.EYEOS_PRINCIPALSERVICE_SEARCHFORCONTACTLIMIT || 15,
		filteredPrincipalIds: [
			"noreply"
		]
	},
	EYEOS_DEVELOPMENT_MODE: EYEOS_DEVELOPMENT_MODE
};

module.exports = Settings;
