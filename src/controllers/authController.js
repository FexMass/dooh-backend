const bcrypt = require("bcryptjs");
const prisma = require("../config/database");

const authController = {
  // POST /api/auth/login
  login: async (request, reply) => {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({
          success: false,
          error: "Email and password are required",
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: "Invalid credentials",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.code(401).send({
          success: false,
          error: "Invalid credentials",
        });
      }

      // Generate JWT token
      const token = request.server.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.send({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Login failed",
      });
    }
  },

  // POST /api/auth/logout
  logout: async (request, reply) => {
    // JWT is stateless, so we just return success
    // Client should delete the token
    return reply.send({
      success: true,
      message: "Logged out successfully",
    });
  },

  // GET /api/auth/me
  getCurrentUser: async (request, reply) => {
    try {
      const userId = request.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: "User not found",
        });
      }

      return reply.send({
        success: true,
        user,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get user",
      });
    }
  },
};

module.exports = authController;
