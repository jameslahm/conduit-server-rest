import express from 'express';
import { User } from '../models';
import { assertWithTypeGuard } from '../utils';
import { ProfileResponseType } from './responseTypes';
import { authentication } from '../middlewares';
import { NotFoundMessage, AuthenticationMessage } from '../config';

export const profileRoute = (app: express.Application) => {
	const router = express.Router();

	// get profile
	router.get(
		'/profiles/:username',
		async (
			req: express.Request<{ username: string }>,
			res: express.Response<ProfileResponseType>
		) => {
			const loginUser = await authentication(app)(req, res);
			const user = await User.findOne({ username: req.params.username });
			if (
				assertWithTypeGuard(user, 404, NotFoundMessage) &&
				assertWithTypeGuard(loginUser, 401, AuthenticationMessage)
			) {
				return res.json({ profile: user.toProfileJsonFor(loginUser) });
			}
		}
	);

    // follow
	router.post(
		'/profiles/:username/follow',
		async (
			req: express.Request<{ username: string }>,
			res: express.Response<ProfileResponseType>
		) => {
			const loginUser = await authentication(app)(req, res);
			const user = await User.findOne({ username: req.params.username });
			if (
				assertWithTypeGuard(user, 404, NotFoundMessage) &&
				assertWithTypeGuard(loginUser, 401, AuthenticationMessage)
			) {
				await loginUser.follow(user);
				return res.json({profile:user.toProfileJsonFor(loginUser)});
			}
		}
    );
    
    // unfollow
    router.delete(
		'/profiles/:username/follow',
		async (
			req: express.Request<{ username: string }>,
			res: express.Response<ProfileResponseType>
		) => {
			const loginUser = await authentication(app)(req, res);
			const user = await User.findOne({ username: req.params.username });
			if (
				assertWithTypeGuard(user, 404, NotFoundMessage) &&
				assertWithTypeGuard(loginUser, 401, AuthenticationMessage)
			) {
				await loginUser.unfollow(user);
				return res.json({profile:user.toProfileJsonFor(loginUser)});
			}
		}
    );

    app.use('/api',router)
};
