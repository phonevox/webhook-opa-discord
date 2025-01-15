import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

const ipCache = new NodeCache({ stdTTL: process.env.TIME_CACHE, checkperiod: process.env.TIME_HIT_CACHE });

// Caminho para o arquivo de IPs permitidos
const allowedIPsPath = path.resolve('allowed_ips.json');

// Função para ler os IPs permitidos do arquivo JSON com cache global
export const getAllowedIPs = (request) => {
    logger.info('Request detected, validating allowed IPs...');

    // Verifica se os IPs estão no cache
    let allowedIPs = ipCache.get('allowed_ips');

    if (!allowedIPs) {
        // Se não estiver no cache, lê do arquivo e armazena no cache
        const data = fs.readFileSync(allowedIPsPath, 'utf8');
        const json = JSON.parse(data);
        allowedIPs = json.allowed_ips;

        // Cacheia os IPs para evitar leituras repetidas
        ipCache.set('allowed_ips', allowedIPs);
        logger.info('Allowed IPs loaded from file and cached');
    }

    request.ip_allowed = allowedIPs;
    return allowedIPs;
};

// Função para atualizar o arquivo de IPs
export const updateAllowedIPs = (allowedIPs) => {
    logger.info('Updating allowed IPs in file...');

    fs.writeFileSync(allowedIPsPath, JSON.stringify({ allowed_ips: allowedIPs }, null, 2));
    ipCache.set('allowed_ips', allowedIPs); // Atualiza o cache
};