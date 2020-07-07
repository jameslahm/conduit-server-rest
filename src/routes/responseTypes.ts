import {
	UserAuthType,
	UserProfileType,
	ArticleJsonType,
	CommentJsonType,
} from '../models';

interface ErrorResponseType {
	errors: any;
}

interface UserResponseType {
	user: UserAuthType;
}

interface ProfileResponseType {
	profile: UserProfileType;
}

interface ArticlesResponseType {
	articles: ArticleJsonType[];
	articlesCount: number;
}

interface ArticleResponseType {
	article: ArticleJsonType;
}

interface CommentResponseType {
	comment: CommentJsonType;
}

interface CommentsResponseType{
	comments:CommentJsonType[]
}

export {
	ErrorResponseType,
	UserResponseType,
	ProfileResponseType,
	ArticlesResponseType,
	ArticleResponseType,
	CommentResponseType,
	CommentsResponseType
};
