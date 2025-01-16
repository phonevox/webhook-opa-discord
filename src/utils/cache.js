import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env
dotenv.config();

const ipCache = new NodeCache({ stdTTL: process.env.TIME_CACHE, checkperiod: process.env.TIME_HIT_CACHE });

// Caminho para o arquivo de IPs permitidos
const allowedIPsPath = path.resolve('allowed_ips.json');

// Lê os IPs fixos do .env
const fixedAllowedIPs = process.env.FIXED_ALLOWED_IPS ? process.env.FIXED_ALLOWED_IPS.split(',') : [];
// Função para ler os IPs permitidos do arquivo JSON com cache global
export const getAllowedIPs = (request) => {
    logger.info('Request detected, validating allowed IPs...');

    // Verifica se os IPs estão no cache
    let allowedIPs = ipCache.get('allowed_ips');

    if (!allowedIPs) {
        // Se não estiver no cache, lê do arquivo e armazena no cache
        let data = '';

        try {
            data = fs.readFileSync(allowedIPsPath, 'utf8');
        } catch (err) {
            // Se ocorrer erro ao ler o arquivo, loga e considera lista vazia
            logger.error('Error reading allowed IPs file', err);
        }

        // Verifica se o arquivo está vazio ou se o JSON é inválido
        if (data && data.trim() !== '') {
            try {
                const json = JSON.parse(data);
                allowedIPs = json.allowed_ips || []; // Se não existir o campo allowed_ips, define uma lista vazia
                logger.info('Allowed IPs loaded from file and cached');
            } catch (err) {
                // Se o JSON estiver corrompido ou inválido, loga o erro
                logger.error('Error parsing allowed IPs JSON', err);
                allowedIPs = []; // Considera lista vazia em caso de erro no JSON
            }
        } else {
            allowedIPs = []; // Caso o arquivo esteja vazio, retorna lista vazia
            logger.info('Allowed IPs file is empty or invalid, using empty list');
        }

        // Cacheia os IPs para evitar leituras repetidas
        ipCache.set('allowed_ips', allowedIPs);
    }

    // Garantir que os IPs fixos estão na lista de IPs permitidos
    fixedAllowedIPs.forEach(fixedIP => {
        // Verifica se o IP fixo não está na lista de IPs e adiciona
        if (!allowedIPs.some(entry => entry.ip === fixedIP)) {
            allowedIPs.push({ id: allowedIPs.length + 1, ip: fixedIP });
            logger.info(`Fixed IP ${fixedIP} added to the allowed list`);
        }
    });

    // Atribui os IPs permitidos ao request, excluindo os fixos da resposta
    request.ip_allowed = allowedIPs.filter(entry => !fixedAllowedIPs.includes(entry.ip));
    return allowedIPs;
};

// Função para retornar os IPs permitidos sem os fixos
export const getAllowedIPsResponse = (request, reply) => {
    let responseData = [];

    // Se a lista de IPs permitidos existir, responde com os IPs não fixos
    if (request.ip_allowed.length > 0) {
        responseData = {
            allowed_ips: request.ip_allowed // Retorna a lista de IPs permitidos sem os fixos
        };
    }

    logRequestAndResponse(request, reply, responseData); // Loga a requisição e resposta
    return reply.status(200).send(responseData); // Retorna a resposta com os IPs permitidos
};

// Função para verificar se o IP do cliente está permitido
export const verifyClientIPAdmin = (request, reply) => {
    const clientIP = request.ip; // Obtém o IP do cliente da requisição

    logger.info(`Client IP: ${clientIP} detected, validating...`);

    // Verifica se o IP do cliente está na lista de IPs permitidos (fixos)
    if (fixedAllowedIPs.includes(clientIP)) {
        logger.info(`Client IP ${clientIP} is allowed for this route.`);
        return true; // O IP está permitido
    }

    // Se o IP não estiver na lista de IPs fixos, retorna Forbidden
    logger.warn(`Client IP ${clientIP} is not allowed for this route.`);
    reply.code(403).send({ error: 'Forbidden' });
    return false; // O IP não está permitido
};

export const checkIsAdmin = async (request, reply) => {
    try {
        const response = verifyClientIPAdmin(request, reply);

        logger.info("Response from verifyClientIPAdmin:", response);
        logger.info("Continuing with getAll method");
    } catch (error) {
        logger.error("Error in getAll method:", error);
        return reply.status(500).send({ error: "Internal Server Error" });
    }
}

// Função para atualizar o arquivo de IPs
export const updateAllowedIPs = (allowedIPs) => {
    logger.info('Updating allowed IPs in file...');

    // Atualiza o arquivo JSON com a lista de IPs
    fs.writeFileSync(allowedIPsPath, JSON.stringify({ allowed_ips: allowedIPs }, null, 2));

    // Atualiza o cache
    ipCache.set('allowed_ips', allowedIPs);
};
