import dotenv from 'dotenv';
// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

import Fastify from 'fastify';

// Importa as funções de controle e utilitários
import { logger } from './src/utils/logger.js';
import { getAllowedIPs } from './src/utils/cache.js';

// Importa as rotas
import { addIpRoute, deleteIpRoute, editIpRoute, getAllIpRoute } from './src/routes/IPRoutes.js';
import { sendMessageRoute } from './src/routes/DiscordRoutes.js';

// Cria uma instância do Fastify com o logger desabilitado (usaremos o Winston para logs)
const fastify = Fastify({
    logger: false,
    trustProxy: '127.0.0.1', // Confia apenas no proxy local (ou IP específico do proxy)
});

// Middleware para verificar se o IP do cliente é permitido
fastify.addHook('onRequest', (request, reply, done) => {
    const allowedIPs = getAllowedIPs(request); // Obtém os IPs permitidos da cache
    const clientIP = request.ip;

    // Verifica se o IP do cliente está na lista de IPs permitidos
    const isAllowed = allowedIPs.some(entry => entry.ip === clientIP);

    // Se o IP não for permitido, retorna um erro 403
    if (!isAllowed) {
        logger.warn(`Unauthorized access attempt from IP: ${clientIP}`);
        reply.status(403).send({ error: 'You are not allowed to access this resource' });
    } else {
        // Caso contrário, permite o acesso
        logger.info(`Access granted to IP: ${clientIP}`);
        done();
    }
});

// Registra as rotas de IPs
fastify.register(addIpRoute);
fastify.register(getAllIpRoute);
fastify.register(editIpRoute);
fastify.register(deleteIpRoute);

// Registra a rota do Discord
fastify.register(sendMessageRoute);

// Inicia o servidor Fastify na porta 3100
const start = async () => {
    try {
        await fastify.listen({ port: 3100, host: '0.0.0.0' });
        logger.info('Server is running on http://localhost:3100'); // Loga quando o servidor estiver iniciado
    } catch (err) {
        logger.error(`Error starting server: ${err.message}`); // Loga erro caso o servidor não consiga iniciar
        process.exit(1);
    }
};

start(); // Inicia o servidor
