import express from 'express';
import { userRoute } from './user';
import { articleRoute } from './article';
import { commentRoute } from './comment';
import { profileRoute } from './profile';

export default (app: express.Application) => {
	userRoute(app);
	profileRoute(app);
	articleRoute(app);
	commentRoute(app);
};
