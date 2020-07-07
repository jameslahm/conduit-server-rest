import Mongoose, { Document, Types } from 'mongoose';
import { UserDocumentType, UserProfileType, User } from './User';
import uniqueValidator from 'mongoose-unique-validator';
import { NotUniqueMessage } from '../config';
import slug from 'slug';

export interface ArticleDocumentType extends Document {
	slug: string;
	title: string;
	description: string;
	body: string;
	tagList: string[];
	favoritesCount: number;
	author: Types.ObjectId | UserDocumentType;
	createdAt: Date;
	updatedAt: Date;
	toJsonFor: (user: UserDocumentType | undefined) => ArticleJsonType;
	slugify: () => void;
	updateFavoriteCount: () => void;
}

export interface ArticleJsonType {
	slug: string;
	title: string;
	description: string;
	body: string;
	tagList: string[];
	createdAt: string;
	updatedAt: string;
	favorited: boolean;
	favoritesCount: number;
	author: UserProfileType;
}

const articleSchema = new Mongoose.Schema<ArticleDocumentType>(
	{
		slug: {
			type: String,
			required: true,
			unique: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		body: {
			type: String,
			required: true,
		},
		tagList: [
			{
				type: String,
			},
		],
		favoritesCount: {
			type: Number,
			default: 0,
		},
		author: {
			type: Mongoose.Types.ObjectId,
			required: true,
			ref: 'User',
		},
	},
	{ timestamps: true }
);

articleSchema.methods.toJsonFor = function (
	user: UserDocumentType | undefined
) {
	return {
		slug: this.slug,
		title: this.title,
		description: this.description,
		body: this.body,
		createdAt: this.createdAt.toISOString(),
		updatedAt: this.updatedAt.toISOString(),
		tagList: this.tagList,
		author: (this.author as UserDocumentType).toProfileJsonFor(user),
		favorited: user ? user.isFavorite(this._id) : false,
		favoritesCount: this.favoritesCount,
	};
};

articleSchema.methods.slugify = function () {
	this.slug =
		slug(this.title) + '-' + (Math.random() * Math.pow(36, 6)).toString(36);
};

articleSchema.pre<ArticleDocumentType>('validate', function (next) {
	if (this.isModified('title')) {
		this.slugify();
	}
	next();
});

articleSchema.methods.updateFavoriteCount = async function () {
	const count = await User.countDocuments({ favorites: { $in: [this._id] } });
	this.favoritesCount = count;
	await this.save();
};

articleSchema.plugin(uniqueValidator, { message: NotUniqueMessage });

export const Article = Mongoose.model<ArticleDocumentType>(
	'Article',
	articleSchema
);
