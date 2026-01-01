const fastify = require('fastify')({ logger: true });
const path = require('path');
const fastifyStatic = require('@fastify/static');
require('dotenv').config();

const start = async () => {
  try {
    // CRITICAL: Serve files under the '/password-generator/' prefix
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../public'),
      prefix: '/password-generator/', 
    });

    const PORT = process.env.PORT || 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${PORT}`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();