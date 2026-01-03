const fastify = require('fastify')({ logger: true });
const path = require('path');
const fastifyStatic = require('@fastify/static');
require('dotenv').config();

const start = async () => {
  try {
    // 1. Serve files at the specific path '/password-generator/'
    // This matches your folder structure and production URL.
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../public'),
      prefix: '/password-generator/', 
    });

    // 2. HELPER: Redirect root to the correct path
    // If you open http://localhost:3000/ locally, this auto-redirects you 
    // to /password-generator/ so you don't think it's broken.
    fastify.get('/', async (req, reply) => {
      return reply.redirect('/password-generator/');
    });

    const PORT = process.env.PORT || 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Access locally at http://localhost:${PORT}/password-generator/`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();