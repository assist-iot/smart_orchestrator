import { Router } from 'express';
import group from './routes/group';
import car from './routes/car';
import enabler from './routes/enabler';

export default () => {
	const app = Router();
    group(app);
    car(app);
    enabler(app);

	return app
}