import express from 'express';
import {
	GetArticlesRequestQueryType,
	GetFeedRequestQueryType,
	GetArticleRequestParamsType,
	PostArticlesRequestBodyType,
	PutArticleRequestBodyType,
} from './requestTypes';
import {
	ArticleResponseType,
	ArticlesResponseType,
	ErrorResponseType,
} from './responseTypes';
import { authentication } from '../middlewares';
import { User, Article, ArticleDocumentType } from '../models';
import { assertWithTypeGuard } from '../utils';
import { AuthenticationMessage, NotFoundMessage } from '../config';
import assert from 'http-assert';
import { body, validationResult } from 'express-validator';

export const articleRoute = (app: express.Application) => {
	const router = express.Router();

	router.get(
		'/articles',
		async (
			req: express.Request<
				any,
				unknown,
				unknown,
				GetArticlesRequestQueryType
			>,
			res: express.Response<ArticlesResponseType>
		) => {
			const loginUser = await authentication(app, { required: false })(
				req,
				res
			);

			const query: {
				author?: string;
				_id?: any;
				tagList?: any;
			} = {};

			if (req.query.tag) {
				query.tagList = { $in: [req.query.tag] };
			}
			if (req.query.author) {
				const author = await User.findOne({
					username: req.query.author,
				});
				if (assertWithTypeGuard(author, 404, NotFoundMessage, false)) {
					query.author = author._id;
				}
			}
			if (req.query.favorited) {
				const favoriter = await User.findOne({
					username: req.query.favorited,
				});
				if (
					assertWithTypeGuard(favoriter, 404, NotFoundMessage, false)
				) {
					query._id = {
						$in: favoriter.favorites,
					};
				}
			}

			const offset = req.query.offset || 0;
			const limit = req.query.limit || 20;

			const articles = await Article.find(query)
				.limit(limit)
				.skip(offset)
				.populate('author');

			return res.json({
				articles: articles.map((article) =>
					article.toJsonFor(loginUser)
				),
				articlesCount: articles.length,
			});
		}
	);

	router.get(
		'/articles/feed',
		async (
			req: express.Request<
				any,
				unknown,
				unknown,
				GetFeedRequestQueryType
			>,
			res: express.Response<ArticlesResponseType>
		) => {
			const loginUser = await authentication(app)(req, res);

			const limit = req.query.limit || 20;
			const offset = req.query.offset || 0;

			if (assertWithTypeGuard(loginUser, 401, AuthenticationMessage)) {
				const articles = await Article.find({
					author: { $in: loginUser.following },
				})
					.limit(limit)
					.skip(offset)
					.populate('author');

				return res.json({
					articles: articles.map((article) =>
						article.toJsonFor(loginUser)
					),
					articlesCount: articles.length,
				});
			}
		}
	);

	router.get(
		'/articles/:slug',
		async (
			req: express.Request<
				GetArticleRequestParamsType,
				unknown,
				unknown,
				unknown
			>,
			res: express.Response<ArticleResponseType>
		) => {
			const loginUser = await authentication(app, { required: false })(
				req,
				res
			);

			const article = await Article.findOne({ slug: req.params.slug }).populate('author');
			if (assertWithTypeGuard(article, 404, NotFoundMessage)) {
				return res.json({ article: article.toJsonFor(loginUser) });
			}
		}
	);

	// create Articles
	router.post(
		'/articles',
		[
			body('article.title').not().isEmpty(),
			body('article.description').not().isEmpty(),
			body('article.body').not().isEmpty(),
			body('article.tagList').isArray(),
		],
		async (
			req: express.Request<
				any,
				unknown,
				PostArticlesRequestBodyType,
				any
			>,
			res: express.Response<ArticleResponseType | ErrorResponseType>
		) => {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.array() });
			}
			const loginUser = await authentication(app)(req, res);
			if (assertWithTypeGuard(loginUser, 401, AuthenticationMessage)) {
				const article = await Article.create({
					...req.body.article,
					author: loginUser,
				} as ArticleDocumentType);
				await article.save()
				return res.json({ article: article.toJsonFor(loginUser) });
			}
		}
	);

	router.put(
		'/articles/:slug',
		async (
			req: express.Request<
				{ slug: string },
				unknown,
				PutArticleRequestBodyType,
				any
			>,
			res: express.Response<ArticleResponseType>
		) => {
			const loginUser = await authentication(app)(req, res);
			if (assertWithTypeGuard(loginUser, 401, AuthenticationMessage)) {
				const article = await Article.findOneAndUpdate(
					{ slug: req.params.slug },
					{ ...req.body }
				).populate('author');
				if (assertWithTypeGuard(article, 404, NotFoundMessage)) {
					return res.json({ article: article.toJsonFor(loginUser) });
				}
			}
		}
	);

	router.delete(
		'/articles/:slug',
		async (
			req: express.Request<{ slug: string }, unknown, unknown, any>,
			res: express.Response<ArticleResponseType>
		) => {
			const loginUser = await authentication(app)(req, res);
			if (assertWithTypeGuard(loginUser, 401, AuthenticationMessage)) {
				const article = await Article.findOneAndDelete({
					slug: req.params.slug,
				}).populate('author');
				if (assertWithTypeGuard(article, 404, NotFoundMessage)) {
					return res.json({ article: article.toJsonFor(loginUser) });
				}
			}
		}
	);

	router.post(
		'/articles/:slug/favorite',
		async (
			req: express.Request<{ slug: string }, unknown, unknown, unknown>,
			res: express.Response<ArticleResponseType>
		) => {
			const loginUser = await authentication(app)(req, res);
			if (assertWithTypeGuard(loginUser, 401, AuthenticationMessage)) {
				const article = await Article.findOne({
					slug: req.params.slug,
				}).populate('author');
				if (assertWithTypeGuard(article, 404, NotFoundMessage)) {
					await loginUser.favorite(article._id);
					await article.updateFavoriteCount();
					return res.json({ article: article.toJsonFor(loginUser) });
				}
			}
		}
	);

	router.delete(
		'/articles/:slug/favorite',
		async (
			req: express.Request<{ slug: string }, unknown, unknown, unknown>,
			res: express.Response<ArticleResponseType>
		) => {
			const loginUser = await authentication(app)(req, res);
			if (assertWithTypeGuard(loginUser, 401, AuthenticationMessage)) {
				const article = await Article.findOne({
					slug: req.params.slug,
				}).populate('author');
				if (assertWithTypeGuard(article, 404, NotFoundMessage)) {
					await loginUser.unFavorite(article._id);
					await article.updateFavoriteCount();
					return res.json({ article: article.toJsonFor(loginUser) });
				}
			}
		}
	);

	router.get('/tags', async (req, res) => {
		const tags = await Article.find().distinct('tagList');
		return res.json({ tags: tags });
	});

	app.use('/api', router);
};
