import express from 'express';
import { PostCommentsRequestBodyType } from './requestTypes';
import { CommentResponseType, CommentsResponseType } from './responseTypes';
import { authentication } from '../middlewares';
import { assertWithTypeGuard } from '../utils';
import { AuthenticationMessage, NotFoundMessage } from '../config';
import { Comment, CommentDocumentType, Article } from '../models';

export const commentRoute = (app: express.Application) => {
	const router = express.Router();

	router.post(
		'/articles/:slug/comments',
		async (
			req: express.Request<
				{ slug: string },
				unknown,
				PostCommentsRequestBodyType,
				any
			>,
			res: express.Response<CommentResponseType>
		) => {
			const loginUser = await authentication(app)(req, res);
			if (assertWithTypeGuard(loginUser, 401, AuthenticationMessage)) {
				const article = await Article.findOne({
					slug: req.params.slug,
				});
				if (assertWithTypeGuard(article, 404, NotFoundMessage)) {
					const comment = await Comment.create({
						body: req.body.comment.body,
						author: loginUser,
						article: article,
					} as CommentDocumentType);
					await comment.save();
					return res.json({ comment: comment.toJsonFor(loginUser) });
				}
			}
		}
	);

	router.get(
		'/articles/:slug/comments',
		async (
			req: express.Request<{ slug: string }, unknown, unknown, unknown>,
			res: express.Response<CommentsResponseType>
		) => {
			const loginUser = await authentication(app, { required: false })(
				req,
				res
			);
			const article = await Article.findOne({ slug: req.params.slug });
			if (assertWithTypeGuard(article, 404, NotFoundMessage)) {
				const comments = await Comment.find({
					article: article._id,
				}).populate('author');
				return res.json({
					comments: comments.map((comment) =>
						comment.toJsonFor(loginUser)
					),
				});
			}
		}
	);

	router.delete(
		'/articles/:slug/comments/:id',
		async (
			req: express.Request<
				{ slug: string; id: string },
				unknown,
				unknown,
				unknown
			>,
			res: express.Response<CommentResponseType>
		) => {
			const loginUser = await authentication(app)(req, res);
			if (assertWithTypeGuard(loginUser, 401, AuthenticationMessage)) {
				const article = await Article.findOne({
					slug: req.params.slug,
				});
				if (assertWithTypeGuard(article, 404, NotFoundMessage)) {
					const comment = await Comment.findOneAndDelete({
						_id: req.params.id,
						article: article._id,
					}).populate('author');
					if (assertWithTypeGuard(comment, 404, NotFoundMessage)) {
						return res.json({
							comment: comment.toJsonFor(loginUser),
						});
					}
				}
			}
		}
	);

	app.use('/api', router);
};
