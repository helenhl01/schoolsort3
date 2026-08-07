import serverless from 'serverless-http';
import app from '../server/server.mjs';

export default serverless(app);
