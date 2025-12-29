const fastify = require('fastify')({ logger: true }); 
const path = require('path'); 
const cors = require('@fastify/cors'); 
const fastifyStatic = require('@fastify/static'); 
require('dotenv').config(); 
const apiRoutes = require('./routes/api'); 

const start = async () => { try { await fastify.register(cors, { origin: true }); 

await fastify.register(fastifyStatic, { 
  root: path.join(__dirname, '../public'), 
  prefix: '/', 
}); 
await fastify.register(apiRoutes, { prefix: '/api' }); 
const PORT = process.env.PORT || 3000; 
await fastify.listen({ port: PORT, host: '0.0.0.0' }); 
console.log(`Server running at http://localhost:${PORT}`); 
} catch (err) { fastify.log.error(err); process.exit(1); } }; start();
