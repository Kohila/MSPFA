import validate from './index.validate';
import type { APIHandler } from 'lib/server/api';
import { verifyPassword } from 'lib/server/auth';
import { Perm } from 'lib/client/perms';
import { permToGetUserInAPI } from 'lib/server/permToGetUser';
import users from 'lib/server/users';
import type { PasswordString } from 'lib/server/users';
import argon2 from 'argon2';

const Handler: APIHandler<{
	query: {
		userID: string
	},
	method: 'PUT',
	body: {
		currentPassword: PasswordString,
		newPassword: PasswordString
	}
}> = async (req, res) => {
	await validate(req, res);

	const user = await permToGetUserInAPI(req, res, Perm.sudoWrite);

	await verifyPassword(res, user, req.body.currentPassword);

	await users.updateOne({
		'_id': user._id,
		'authMethods.type': 'password'
	}, {
		$set: {
			'authMethods.$.value': await argon2.hash(req.body.newPassword)
		}
	});

	res.end();
};

export default Handler;