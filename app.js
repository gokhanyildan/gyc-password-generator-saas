const fastify = require('fastify')({ logger: true });
const path = require('path');
const fastifyStatic = require('@fastify/static');
require('dotenv').config();

const start = async () => {
  try {
    // 1. Serve Static Files (The only thing we need)
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../public'),
      prefix: '/password-generator/',
    });

    // 2. Start the server
    const PORT = process.env.PORT || 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`G-Guard Static Server running at http://localhost:${PORT}`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();