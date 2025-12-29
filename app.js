const fastify = require('fastify')({ logger: true });
const path = require('path');
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
require('dotenv').config();

// Import Routes
const apiRoutes = require('./routes/api');

const start = async () => {
  try {
    // 1. Register CORS (Cross-Origin Resource Sharing)
    await fastify.register(cors, { 
      origin: true // Allow all origins for MVP
    });

    // 2. Register Static File Serving (Frontend)
    // This serves index.html when you go to http://localhost:3000/
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../public'),
      prefix: '/', // optional: default '/'
    });

    // 3. Register API Routes
    // All routes in api.js will be prefixed with /api
    await fastify.register(apiRoutes, { prefix: '/api' });

    // 4. Start listening
    const PORT = process.env.PORT || 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    
    console.log(`Server running at http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();