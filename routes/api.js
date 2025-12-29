const { generatePassword } = require('../utils/generator');

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options  Plugin options
 */
async function routes(fastify, options) {
  
  // GET /api/generate?length=16&uppercase=true...
  fastify.get('/generate', async (request, reply) => {
    
    // 1. Extract query parameters with defaults
    // Note: Query params come as strings, so we must parse them.
    const length = parseInt(request.query.length) || 12;
    const useUppercase = request.query.uppercase !== 'false'; // Default to true
    const useNumbers = request.query.numbers !== 'false';     // Default to true
    const useSymbols = request.query.symbols !== 'false';     // Default to true

    // 2. Validate length (Basic security limits)
    if (length > 128 || length < 4) {
      return reply.code(400).send({ error: "Length must be between 4 and 128 characters." });
    }

    // 3. Generate password
    const password = generatePassword({
      length,
      useUppercase,
      useNumbers,
      useSymbols
    });

    // 4. Return JSON response
    return { password, success: true };
  });
}

module.exports = routes;