import { Router } from 'express';
import cluster from './routes/clusters';

export default () => {
	const app = Router();
    cluster(app);

	return app
}