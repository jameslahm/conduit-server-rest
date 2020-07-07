import './config';
import express from 'express';
import bodyParser from 'body-parser';
import routes from './routes';
import mongoose from 'mongoose';

// Log Middleware
import {
	accessLogMiddleware,
	errorLogMiddleware,
	consoleLogMiddleware,
} from './logger';
import { NotUniqueMessage } from './config';

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.MONGODBURI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const app = express();
app.set('secret', process.env.SECRET);

app.use(bodyParser.json());

// apply log middleware
app.use(accessLogMiddleware);
app.use(errorLogMiddleware);
app.use(consoleLogMiddleware);

routes(app);

app.use(
	(
		error: Error & { status: number },
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		if (error.status) {
			return res.status(error.status).json({ errors: error.message });
		}
		console.log(error);
		if (error.name == 'ValidationError') {
			return res.status(422).json({ errors: NotUniqueMessage });
		}
		console.log(error.message);
		res.sendStatus(500);
	}
);

app.listen(3000, () => {
	console.log(`Listening on http://localhost:3000`);
});
