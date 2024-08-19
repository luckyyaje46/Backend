const fastify = require('fastify')({ logger: true });
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient();
const cors = require('@fastify/cors');

fastify.register(cors, {
  origin: '*', 
});

// Process Transaction
async function processTransaction(transaction) {
  return new Promise((resolve) => {
    console.log('Transaction processing started for:', transaction);
    setTimeout(() => {
      console.log('Transaction processed for:', transaction);
      resolve(transaction);
    }, 30000); // 30 seconds delay
  });
}

// Send or Withdraw API
fastify.post('/transaction', async (request, reply) => {
  const { amount, accountId } = request.body;
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    return reply.status(404).send({ error: 'Account not found' });
  }

  // Adjust balance based on transaction
  const updatedBalance = account.balance + amount;
  await prisma.account.update({
    where: { id: accountId },
    data: { balance: updatedBalance },
  });

  const transaction = await prisma.history.create({
    data: {
      accountId,
      amount,
    },
  });

  await processTransaction(transaction);
  reply.send(transaction);
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
