// This file is automatically generated by `scripts/generate-validators`. Do not edit directly.

import { createValidator } from 'lib/server/api';

export default createValidator({
	$schema: 'http://json-schema.org/draft-07/schema#',
	$ref: '#/definitions/RequestMethod',
	definitions: {
		RequestMethod: {
			type: 'string',
			enum: [
				'DELETE',
				'POST'
			]
		}
	}
}, {
	$schema: 'http://json-schema.org/draft-07/schema#',
	$ref: '#/definitions/Request',
	definitions: {
		Request: {
			anyOf: [
				{
					type: 'object',
					additionalProperties: false,
					properties: {
						body: {},
						query: {},
						method: {
							type: 'string',
							const: 'DELETE'
						}
					},
					required: [
						'method'
					]
				},
				{
					type: 'object',
					additionalProperties: false,
					properties: {
						body: {
							$ref: '#/definitions/SessionBody'
						},
						query: {},
						method: {
							type: 'string',
							const: 'POST'
						}
					},
					required: [
						'body',
						'method'
					]
				}
			]
		},
		SessionBody: {
			anyOf: [
				{
					type: 'object',
					properties: {
						authMethod: {
							$ref: '#/definitions/ExternalAuthMethodOptions'
						}
					},
					required: [
						'authMethod'
					],
					additionalProperties: false
				},
				{
					type: 'object',
					properties: {
						authMethod: {
							$ref: '#/definitions/InternalAuthMethodOptions'
						},
						email: {
							$ref: '#/definitions/EmailString'
						}
					},
					required: [
						'authMethod',
						'email'
					],
					additionalProperties: false
				}
			]
		},
		ExternalAuthMethodOptions: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					enum: [
						'google',
						'discord'
					]
				},
				value: {
					type: 'string',
					minLength: 1
				}
			},
			required: [
				'type',
				'value'
			],
			additionalProperties: false
		},
		InternalAuthMethodOptions: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					const: 'password'
				},
				value: {
					$ref: '#/definitions/PasswordString'
				}
			},
			required: [
				'type',
				'value'
			],
			additionalProperties: false
		},
		PasswordString: {
			type: 'string',
			minLength: 8
		},
		EmailString: {
			type: 'string',
			pattern: '^[a-zA-Z0-9.!#$%&\'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
		}
	}
});