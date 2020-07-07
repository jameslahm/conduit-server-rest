interface PostLoginRequestBodyType {
	user: {
		email: string;
		password: string;
	};
}

interface PostRegistrationRequestBodyType {
	user: {
		username: string;
		email: string;
		password: string;
	};
}

interface GetArticlesRequestQueryType {
	tag?: string;
	author?: string;
	favorited?: string;
	limit?: number;
	offset?: number;
}

interface GetFeedRequestQueryType {
	limit: number;
	offset: number;
}

interface GetArticleRequestParamsType {
	slug: string;
	[index: string]: string;
}

interface PostArticlesRequestBodyType {
	article: {
		title: string;
		description: string;
		body: string;
		tagList: string[];
	};
}

interface PutArticleRequestBodyType{
	article:{
		title?:string;
		description:string;
		body:string
	}
}

interface PostCommentsRequestBodyType{
	comment:{
		body:string
	}
}


export {
	PostLoginRequestBodyType,
	PostRegistrationRequestBodyType,
	GetArticlesRequestQueryType,
	GetFeedRequestQueryType,
	GetArticleRequestParamsType,
	PostArticlesRequestBodyType,
	PutArticleRequestBodyType,
	PostCommentsRequestBodyType
};
