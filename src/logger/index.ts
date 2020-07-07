import { createStream } from 'rotating-file-stream';
import path from 'path';
import morgan from 'morgan';

morgan.token('date', function () {
	var p = new Date()
		.toString()
		.replace(/[A-Z]{3}\+/, '+')
		.split(/ /);
	return p[2] + '/' + p[1] + '/' + p[3] + ':' + p[4] + ' ' + p[5];
});

const accessLogStream = createStream('access.log', {
	interval: '1d',
	path: path.join(__dirname,'access'),
});

const errorLogStream = createStream('error.log', {
	interval: '1d',
	path: path.join(__dirname,'error'),
});

const accessLogMiddleware = morgan('combined', {
	stream: accessLogStream,
});

const errorLogMiddleware = morgan('combined', {
	stream: errorLogStream,
	skip: (req, res) => {
		return res.statusCode < 400;
	},
});

const consoleLogMiddleware = morgan('combined');

export { accessLogMiddleware, errorLogMiddleware, consoleLogMiddleware };
