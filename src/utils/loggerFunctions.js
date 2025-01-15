import { logger } from './logger.js';  // Importa o logger já configurado

// Função para logar a requisição e a resposta
export const logRequestAndResponse = (request, reply, responseData) => {
    // Log da requisição
    const body = request.body ? JSON.stringify(request.body) : 'N/A';
    logger.debug(`REQ [${request.ip}] ${request.method} ${request.url} | Body: ${body}`);

    // Log da resposta
    logger.debug(`RES [${request.ip}] ${request.method} ${request.url} | Status: ${reply.statusCode} | Response Body: ${JSON.stringify(responseData)}`);
};
