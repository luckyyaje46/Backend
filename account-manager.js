const fastify = require('fastify')({ logger: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('@fastify/jwt');
const cors = require('@fastify/cors');


fastify.register(cors, {
  origin: '*', 
});


fastify.register(jwt, {
  secret: 'supersecret',
});


fastify.post('/register', async (request, reply) => {
  const { email, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
  reply.send({ user });
});

// User login
fastify.post('/login', async (request, reply) => {
  const { email, password } = request.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }
  const token = fastify.jwt.sign({ id: user.id, email: user.email });
  reply.send({ token });
});

// Get all accounts of a user
fastify.get('/accounts', async (request, reply) => {
  try {
    const decoded = await request.jwtVerify();
    const accounts = await prisma.account.findMany({ where: { userId: decoded.id } });
    reply.send(accounts);
  } catch (err) {
    reply.send(err);
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
