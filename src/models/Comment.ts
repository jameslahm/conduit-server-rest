import Mongoose, { Document, Types } from 'mongoose';
import { UserDocumentType, UserProfileType } from './User';
import { ArticleDocumentType } from './Article';

interface CommentJsonType {
	id: string;
	createdAt: string;
	updatedAt: string;
	body: string;
	author: UserProfileType;
}

interface CommentDocumentType extends Document {
	body: string;
	createdAt: Date;
	updatedAt: Date;
	author: Types.ObjectId | UserDocumentType;
	article: Types.ObjectId | ArticleDocumentType;
	toJsonFor: (user: UserDocumentType | undefined) => CommentJsonType;
}

const commentSchema = new Mongoose.Schema<CommentDocumentType>(
	{
		body: {
			type: String,
			required: true,
		},
		author: {
			type: Mongoose.Types.ObjectId,
			ref: 'User',
		},
		article: {
			type: Mongoose.Types.ObjectId,
			ref: 'Article',
		},
	},
	{ timestamps: true }
);

commentSchema.methods.toJsonFor = function (user) {
	return {
		id: this._id,
		createdAt: this.createdAt.toISOString(),
		updatedAt: this.updatedAt.toISOString(),
		body: this.body,
		author: (this.author as UserDocumentType).toProfileJsonFor(user),
	};
};

export const Comment = Mongoose.model<CommentDocumentType>(
	'Comment',
	commentSchema
);

export { CommentJsonType, CommentDocumentType };
