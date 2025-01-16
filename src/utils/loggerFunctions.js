import { stringify } from 'flatted';
import { logger } from './logger.js';

// Função para logar a requisição e a resposta
export const logRequestAndResponse = (request, reply, responseData) => {
    // Log da requisição
    const body = request.body ? stringify(request.body) : 'N/A';
    logger.debug(`REQ [${request.ip}] ${request.method} ${request.url} | Body: ${body}`);

    // Log da resposta
    logger.debug(`RES [${request.ip}] ${request.method} ${request.url} | Status: ${reply.statusCode} | Response Body: ${stringify(responseData)}`);
};
