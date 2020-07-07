import assert from 'http-assert';

// helper
export const assertWithTypeGuard = <T>(
	_: T | null | undefined,
	statusCode: number,
	message: string,
	required: boolean = true
): _ is T => {
	if (required) assert(_, statusCode, message);
	return _ ? true : false;
};
