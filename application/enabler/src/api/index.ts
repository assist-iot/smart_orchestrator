import { Router } from 'express';
import repo from './routes/enabler';

export default () => {
	const app = Router();
    repo(app);

	return app
}