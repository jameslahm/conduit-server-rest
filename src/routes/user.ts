import express, { Application } from 'express';
import { body, validationResult } from 'express-validator';
import { User, UserDocumentType } from '../models';
import bcrypt from 'bcryptjs';
import { assertWithTypeGuard } from '../utils';
import { authentication } from '../middlewares';
import {
	PostLoginRequestBodyType,
	PostRegistrationRequestBodyType,
} from './requestTypes';
import { ErrorResponseType, UserResponseType } from './responseTypes';
import {
	NotFoundMessage,
	AuthenticationMessage,
	InternalServerErrorMessage,
} from '../config';

export const userRoute = (app: Application) => {
	const router = express.Router();

	// login
	router.post(
		'/users/login',
		[
			body('user.email').isEmail(),
			body('user.password').isLength({ min: 5 }),
		],
		async (
			req: express.Request<never, never, PostLoginRequestBodyType, never>,
			res: express.Response<UserResponseType | ErrorResponseType>
		) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(401).json({ errors: errors.array });
			}

			const user = await User.findOne({ email: req.body.user.email });

			if (assertWithTypeGuard(user, 404, NotFoundMessage)) {
				const passwordVerifyResult = bcrypt.compareSync(
					req.body.user.password,
					user.password
				);
				if (
					assertWithTypeGuard(
						passwordVerifyResult,
						401,
						AuthenticationMessage
					)
				) {
					return res.json({ user: user.toAuthJson() });
				}
			}
		}
	);

	// registration
	router.post(
		'/users',
		[
			body('user.username').not().isEmpty(),
			body('user.email').isEmail(),
			body('user.password').isLength({ min: 5 }),
		],
		async (
			req: express.Request<
				never,
				never,
				PostRegistrationRequestBodyType,
				never
			>,
			res: express.Response<UserResponseType | ErrorResponseType>
		) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}
			const user = await User.create(req.body.user as UserDocumentType);
			if (assertWithTypeGuard(user, 500, InternalServerErrorMessage)) {
				return res.json({ user: user.toAuthJson() });
			}
		}
	);

	// Get Current User
	router.get(
		'/user',
		async (
			req: express.Request,
			res: express.Response<UserResponseType>
		) => {
			const user = await authentication(app)(req, res);
			if (assertWithTypeGuard(user, 401, AuthenticationMessage)) {
				return res.json({ user: user.toAuthJson() });
			}
		}
	);

	// update User
	router.put(
		'/user',
		async (
			req: express.Request,
			res: express.Response<UserResponseType>
		) => {
			const user = await authentication(app)(req, res);
			if (user) {
				await user.update({ ...req.body.user });
				await user.save();
				return res.json({ user: user.toAuthJson() });
			}
		}
	);

	app.use('/api', router);
};
