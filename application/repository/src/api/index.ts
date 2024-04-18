import { Router } from 'express';
import repo from './routes/repos';

export default () => {
	const app = Router();
    repo(app);

	return app
}