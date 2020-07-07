import express from 'express';
import { assertWithTypeGuard } from '../utils';
import jwt from 'jsonwebtoken';
import { User, UserDocumentType } from '../models';
import { NotFoundMessage, AuthenticationMessage } from '../config';

export const authentication = (
	app: express.Application,
	{ required } = { required: true }
) => async (
	req: express.Request<any, any, any, any>,
	res: express.Response
) => {
	const token = req.headers.authorization?.split(' ')[1];
	if (assertWithTypeGuard(token, 401, AuthenticationMessage, required)) {
		try {
			const payload = jwt.verify(token, app.get('secret')) as {
				id?: string;
			};
			if (
				assertWithTypeGuard(
					payload.id,
					401,
					AuthenticationMessage,
					required
				)
			) {
				const user = await User.findById(payload.id);
				if (assertWithTypeGuard(user, 404, NotFoundMessage, required)) {
					return user;
				}
			}
		} catch (error) {
			return undefined;
		}
	}
	return undefined;
};
