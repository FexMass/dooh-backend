const authenticate = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({
      success: false,
      error: "Unauthorized - Invalid or missing token",
    });
  }
};

module.exports = { authenticate };
