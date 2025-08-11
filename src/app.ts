import 'dotenv/config';
import { createAppContainer } from './loaders/awilix';
import { createExpressApp } from './loaders/express';

const container = createAppContainer();
const app = createExpressApp(container);

export { app, container }; 