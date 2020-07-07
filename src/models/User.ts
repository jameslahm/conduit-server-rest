import Mongoose, { Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ArticleDocumentType } from './Article';
import uniqueValidator from 'mongoose-unique-validator';
import { NotUniqueMessage } from '../config';

interface UserAuthType {
	email: string;
	token: string;
	username: string;
	bio: string;
	image: string;
}

interface UserProfileType {
	username: string;
	bio: string;
	image: string;
	following: boolean;
}

export interface UserDocumentType extends Document {
	email: string;
	username: string;
	bio: string;
	image: string;
	password: string;
	following: Types.ObjectId[] | UserDocumentType[];
	favorites: Types.ObjectId[] | ArticleDocumentType[];
	generateJwtToken: () => string;
	toAuthJson: () => UserAuthType;
	toProfileJsonFor: (user: UserDocumentType | undefined) => UserProfileType;
	follow: (user: UserDocumentType) => void;
	unfollow: (user: UserDocumentType) => void;
	isFavorite: (articleId: Types.ObjectId) => boolean;
	favorite: (articleId: Types.ObjectId) => void;
	unFavorite: (articleId: Types.ObjectId) => void;
}

const userSchema = new Mongoose.Schema<UserDocumentType>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
		},
		bio: {
			type: String,
			required: false,
			default: '',
		},
		image: {
			type: String,
			required: false,
			default: '',
		},
		password: {
			type: String,
			required: true,
			set(val: string) {
				return bcrypt.hashSync(val, 8);
			},
		},
		favorites: [
			{
				type: Mongoose.Types.ObjectId,
				ref: 'Article',
			},
		],
		following: [
			{
				type: Mongoose.Types.ObjectId,
				ref: 'User',
			},
		],
	},
	{
		timestamps: true,
	}
);

userSchema.methods.generateJwtToken = function () {
	return jwt.sign({ id: this._id }, process.env.SECRET as string, {
		expiresIn: '31d',
	});
};

userSchema.methods.toAuthJson = function () {
	return {
		email: this.email,
		token: this.generateJwtToken(),
		username: this.email,
		bio: this.email,
		image: this.image,
	};
};

userSchema.methods.toProfileJsonFor = function (
	user: UserDocumentType | undefined
) {
	return {
		username: this.username,
		bio: this.bio,
		image: this.image,
		following: user
			? (user.following as Types.ObjectId[]).some((id) => {
					return id === this._id;
			  })
			: false,
	};
};

userSchema.methods.follow = async function (user: UserDocumentType) {
	this.following.push(user._id);
	await this.save();
};

userSchema.methods.unfollow = async function (user: UserDocumentType) {
	const index = this.following.indexOf(user._id);
	if (index > -1) {
		this.following.splice(index, 1);
	}
	await this.save();
};

userSchema.methods.isFavorite = function (id) {
	if ((this.favorites as Types.ObjectId[]).includes(id)) {
		return true;
	} else {
		return false;
	}
};

userSchema.methods.favorite =async  function (id) {
	if ((this.favorites as Types.ObjectId[]).includes(id)) {
		return;
	} else {
		(this.favorites as Types.ObjectId[]).push(id);
		await this.save()
	}
};

userSchema.methods.unFavorite =async function (id) {
	const index = (this.favorites as Types.ObjectId[]).indexOf(id);
	if (index > -1) {
		(this.favorites as Types.ObjectId[]).splice(index, 1);
		await this.save()
	} else {
		return;
	}
};

userSchema.plugin(uniqueValidator, { message: NotUniqueMessage });

export const User = Mongoose.model<UserDocumentType>('User', userSchema);
export { UserAuthType, UserProfileType };
