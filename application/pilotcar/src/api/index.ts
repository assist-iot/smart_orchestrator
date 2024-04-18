import { Router } from 'express';
import pilotBackend from './routes/pilotBackendRoutes';

export default () => {
	const app = Router();
    pilotBackend(app);

	return app
}