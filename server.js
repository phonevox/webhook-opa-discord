// Importa as bibliotecas necessárias
import dotenv from 'dotenv';
// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

import Fastify from 'fastify';

// Importa as funções de controle e utilitários
import { logger } from './src/utils/logger.js';
import { getAllowedIPs } from './src/utils/cache.js';

// Importa os controladores
import { IpController } from './src/controller/IPController.js';
import { DiscordController } from './src/controller/DiscordController.js';

// Importa os schemas
import { sendMessageSchema } from './src/schemas/discord/schemas.js'
import { addIPSchema, deleteIPSchema, editIPSchema } from './src/schemas/ips/schemas.js';

// Cria uma instância do Fastify com o logger desabilitado (usaremos o Winston para logs)
const fastify = Fastify({
    logger: false
});

// Middleware para verificar se o IP do cliente é permitido
fastify.addHook('onRequest', (request, reply, done) => {
    const allowedIPs = getAllowedIPs(request); // Obtém os IPs permitidos da cache
    const clientIP = request.ip;

    // Remover depois, deixar só o request.ip a opção de x-forwarded-for serve para simular outro ip, é possivel passar no curl, já o request.ip é o ip do cliente sempre e não é alterável.
    // Para passar o ip no headers basta fazer isso: curl -H "X-Forwarded-For: 192.168.1.1" http://localhost:3000/allowed-ips
    // const clientIP = request.headers['x-forwarded-for'] || request.ip; 

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

// Rota para adicionar um IP à lista de permitidos
fastify.post('/allowed-ips', { schema: addIPSchema }, async (request, reply) => {
    await IpController.create(request, reply); // Chama o método create da classe IPController
});

// Rota para obter todos os IPs permitidos
fastify.get('/allowed-ips', async (request, reply) => {
    await IpController.getAll(request, reply); // Chama o método getAll da classe IPController
});

// Rota para atualizar um IP permitido
fastify.put('/allowed-ips', { schema: editIPSchema }, async (request, reply) => {
    await IpController.edit(request, reply); // Chama o método edit da classe IPController
});

// Rota para deletar um IP permitido
fastify.delete('/allowed-ips', { schema: deleteIPSchema }, async (request, reply) => {
    await IpController.delete(request, reply); // Chama o método edit da classe IPController
});

// Rota para enviar mensagem para o Discord via Webhook
fastify.post('/send-message', { schema: sendMessageSchema }, async (request, reply) => {
    await DiscordController.sendMessage(request, reply); // Chama o método sendMessage da classe DiscordController
});

// Inicia o servidor Fastify na porta 3000
const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        logger.info('Server is running on http://localhost:3000'); // Loga quando o servidor estiver iniciado
    } catch (err) {
        logger.error(`Error starting server: ${err.message}`); // Loga erro caso o servidor não consiga iniciar
        process.exit(1);
    }
};

start(); // Inicia o servidor
