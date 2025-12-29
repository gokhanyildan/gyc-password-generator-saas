const { generatePassword } = require('../utils/generator'); 
async function routes(fastify, options) { fastify.get('/generate', async (request, reply) => { const length = parseInt(request.query.length) || 12; const useLowercase = request.query.lowercase !== 'false'; const useUppercase = request.query.uppercase !== 'false'; const useNumbers = request.query.numbers !== 'false'; const useSymbols = request.query.symbols !== 'false'; 

if (length > 128 || length < 4) { 
  return reply.code(400).send({ error: "Length must be between 4 and 128 characters." }); 
} 
const password = generatePassword({ length, useLowercase, useUppercase, useNumbers, useSymbols }); 
return { password, success: true }; 
}); } module.exports = routes; 
