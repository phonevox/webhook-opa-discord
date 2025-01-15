import dotenv from 'dotenv';
import Fastify from 'fastify';
import axios from 'axios';

import { logger } from './src/utils/logger.js';
import { logRequestAndResponse } from './src/utils/loggerFunctions.js';
import { getAllowedIPs, updateAllowedIPs } from './src/utils/cache.js';
import { resolveDomainToIP, isValidIP } from './src/utils/functions.js';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Cria uma instância do Fastify com o logger desabilitado (usaremos o Winston para logs)
const fastify = Fastify({
    logger: false // Usaremos o Winston para logging
});

// Middleware para verificar se o IP do cliente é permitido
fastify.addHook('onRequest', (request, reply, done) => {
    const allowedIPs = getAllowedIPs(request); // Obtém os IPs permitidos da cache
    const clientIP = request.ip; // Obtém o IP do cliente

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

// Rota para obter todos os IPs permitidos
fastify.get('/allowed-ips', async (request, reply) => {
    const responseData = {
        allowed_ips: request.ip_allowed // Retorna a lista de IPs permitidos
    };

    logRequestAndResponse(request, reply, responseData); // Loga a requisição e resposta

    return { responseData }; // Retorna a resposta com os IPs permitidos
});

// Rota para adicionar um IP à lista de permitidos
fastify.post('/allowed-ips', async (request, reply) => {
    const { ip } = request.body; // Obtém o IP enviado no corpo da requisição
    let ipToAdd = ip; // Inicializa o IP a ser adicionado

    logger.info(`Received IP to add: ${ip}`); // Loga o IP recebido

    // Obtém a lista atual de IPs permitidos
    const allowedIps = request.ip_allowed;
    logger.info(`Current allowed IPs: ${JSON.stringify(allowedIps)}`); // Loga a lista atual de IPs

    // Se o valor fornecido for um domínio, tentamos resolver o domínio para um IP
    if (!isValidIP(ip)) { // Verifica se o valor não é um IP
        try {
            logger.info(`IP is a domain, resolving ${ip} to IP...`);
            ipToAdd = await resolveDomainToIP(ip); // Resolve o domínio para IP
            logger.info(`Domain ${ip} resolved to IP: ${ipToAdd}`);
        } catch (error) {
            // Se ocorrer um erro ao resolver o domínio, retorna um erro 400
            logger.error(`Error resolving domain: ${ip}. Error: ${error.message}`);
            return reply.status(400).send({ error: `Invalid domain: ${ip}. Error: ${error.message}` });
        }
    }

    // Verifica se o IP já existe na lista de IPs permitidos
    if (allowedIps.some(entry => entry.ip === ipToAdd)) {
        logger.warn(`IP ${ipToAdd} already exists in the allowed list.`); // Loga aviso se o IP já existir
        return reply.status(400).send({ error: 'IP already exists' }); // Retorna erro caso o IP já esteja na lista
    }

    logger.info(`IP ${ipToAdd} does not exist in the allowed list, adding it...`);

    // Calcula um novo ID para o IP (Maior ID + 1)
    const newID = allowedIps.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
    logger.info(`Calculated new ID for the IP: ${newID}`);

    // Adiciona o novo IP à lista
    const newIP = { id: newID, ip: ipToAdd };
    allowedIps.push(newIP);
    logger.info(`New IP added: ${JSON.stringify(newIP)}`);

    // Atualiza a lista de IPs permitidos (no cache e no arquivo)
    updateAllowedIPs(allowedIps);
    logger.info(`Allowed IPs list updated.`);

    const responseData = {
        message: 'IP added successfully',
        ip: newIP
    };

    logRequestAndResponse(request, reply, responseData); // Loga a requisição e resposta

    return responseData; // Retorna resposta com sucesso
});

// Rota para atualizar um IP permitido
fastify.put('/allowed-ips/:id', async (request, reply) => {
    const { id } = request.params; // Obtém o ID do IP a ser atualizado
    const { ip } = request.body; // Obtém o novo IP

    // Verifica se o IP é válido
    if (!isValidIP(ip)) {
        return reply.status(400).send({ error: 'Invalid IP' }); // Retorna erro se o IP for inválido
    }

    const allowedIPs = request.ip_allowed; // Obtém a lista de IPs permitidos
    const ipIndex = allowedIPs.findIndex(entry => entry.id === parseInt(id)); // Encontra o IP pelo ID

    // Se o IP não for encontrado, retorna erro 404
    if (ipIndex === -1) {
        return reply.status(404).send({ error: 'IP not found' });
    }

    // Atualiza o IP no registro correspondente
    allowedIPs[ipIndex].ip = ip;

    // Atualiza a lista de IPs permitidos
    updateAllowedIPs(allowedIPs);

    const responseData = {
        success: true,
        updated_ip: allowedIPs[ipIndex]
    };

    logRequestAndResponse(request, reply, responseData); // Loga a requisição e resposta

    return { responseData }; // Retorna a resposta com sucesso
});

// Rota para deletar um IP permitido
fastify.delete('/allowed-ips', async (request, reply) => {
    const { ip } = request.body;

    const allowedIPs = request.ip_allowed;
    let ipToRemove = ip;

    // Se o valor fornecido for um domínio, tentamos resolvê-lo para IP
    if (!isValidIP(ip)) { // Verifica se não é um IP
        try {
            logger.info(`IP is a domain, resolving ${ip} to IP...`);
            ipToRemove = await resolveDomainToIP(ip); // Resolve o domínio para o IP
            logger.info(`Domain ${ip} resolved to IP: ${ipToRemove}`);
        } catch (error) {
            logger.error(`Error resolving domain: ${ip}. Error: ${error.message}`);
            return reply.status(400).send({ error: `Invalid domain: ${ip}. Error: ${error.message}` });
        }
    }

    // Filtra os IPs permitidos, removendo o IP fornecido
    const newAllowedIPs = allowedIPs.filter(entry => entry.ip !== ipToRemove);

    if (newAllowedIPs.length === allowedIPs.length) {
        return reply.status(404).send({ error: 'IP not found' });
    }

    // Atualiza o arquivo e o cache com os novos IPs permitidos
    updateAllowedIPs(newAllowedIPs);

    const responseData = {
        success: true,
        message: 'IP deleted'
    };

    logRequestAndResponse(request, reply, responseData);

    return { responseData };
});

// Rota para enviar mensagem para o Discord via Webhook
fastify.post('/send-message', async (request, reply) => {
    const { nome_empresa, msg, client_name, number_client } = request.body; // Obtém os dados da requisição

    try {
        // Envia uma requisição POST para o Webhook do Discord com os dados formatados
        const response = await axios.post(`${process.env.DISCORD_WEBOOK}`, {
            embeds: [
                {
                    type: "rich",
                    title: `Atenção: Logar no Opa! Suite da empresa ${nome_empresa}`,
                    description: `${msg}`,
                    color: 16711680, // Cor vermelha
                    thumbnail: {
                        "url": "https://em-content.zobj.net/source/noto-emoji-animations/344/police-car-light_1f6a8.gif",
                        "height": 0,
                        "width": 0
                    },
                    url: "https://opa.phonevox.br/atendente/",
                    fields: [
                        {
                            "name": "CLIENTE",
                            "value": `\`${client_name}\``,
                            "inline": true
                        },
                        {
                            "name": "NÚMERO",
                            "value": `\`${number_client}\``,
                            "inline": true
                        },
                    ]
                }
            ]
        });

        console.log(response.data); // Loga a resposta do Discord

        const responseData = {
            message: 'Message sent successfully',
        };

        logRequestAndResponse(request, reply, responseData); // Loga a requisição e resposta

        return { responseData }; // Retorna sucesso
    } catch (error) {
        logger.error(`Error sending message: ${error.message}`); // Loga o erro

        return reply.status(500).send({ error: 'Error sending message' }); // Retorna erro 500
    }
});

// Inicia o servidor Fastify na porta 3000
const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
        logger.info('Server is running on http://localhost:3000'); // Loga quando o servidor estiver iniciado
    } catch (err) {
        logger.error(`Error starting server: ${err.message}`); // Loga erro caso o servidor não consiga iniciar
        process.exit(1);
    }
};

start(); // Inicia o servidor
