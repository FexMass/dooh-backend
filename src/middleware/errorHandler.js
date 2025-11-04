const errorHandler = (error, request, reply) => {
  const statusCode = error.statusCode || 500;

  request.log.error(error);

  reply.code(statusCode).send({
    success: false,
    error: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

module.exports = errorHandler;
