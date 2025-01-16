import { DiscordModel } from "../models/DiscordModel.js";
import { logger } from "../utils/logger.js";
import { logRequestAndResponse } from "../utils/loggerFunctions.js";

class DISCORDController {
    sendMessage = async (request, reply) => {
        const { url_opa, nome_empresa, msg, client_name, number_client } = request.body; // Obtém os dados da requisição

        try {
            // Envia uma requisição POST para o Webhook do Discord com os dados formatados
            await DiscordModel.sendMessage({ url_opa, nome_empresa, msg, client_name, number_client });

            const responseData = {
                message: 'Message sent successfully',
            };

            logRequestAndResponse(request, reply, responseData); // Loga a requisição e resposta

            return reply.status(200).send(responseData); // Retorna sucesso
        } catch (error) {
            logger.error(`Error sending message: ${error.message}`); // Loga o erro

            return reply.status(500).send({ error: 'Error sending message' }); // Retorna erro 500
        }
    }
}

// Exportando e já instânciando a classe
export const DiscordController = new DISCORDController();