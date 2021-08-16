// This file is automatically generated by `scripts/generate-validators`. Do not edit directly.

import { createValidator } from 'lib/server/api';

export default createValidator({
	$schema: 'http://json-schema.org/draft-07/schema#',
	$ref: '#/definitions/RequestMethod',
	definitions: {
		RequestMethod: {
			type: 'string',
			const: 'DELETE'
		}
	}
}, {
	$schema: 'http://json-schema.org/draft-07/schema#',
	$ref: '#/definitions/Request',
	definitions: {
		Request: {
			type: 'object',
			additionalProperties: false,
			properties: {
				body: {},
				query: {
					type: 'object',
					properties: {
						userID: {
							type: 'string'
						},
						authMethodID: {
							type: 'string'
						}
					},
					required: [
						'userID',
						'authMethodID'
					],
					additionalProperties: false
				},
				method: {
					type: 'string',
					const: 'DELETE'
				}
			},
			required: [
				'method',
				'query'
			]
		}
	}
});