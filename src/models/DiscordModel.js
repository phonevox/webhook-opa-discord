import axios from "axios";
import { logger } from "../utils/logger.js";
import { stringify } from "flatted";

class DISCORDModel {
    sendMessage = async ({ url_opa, nome_empresa, msg, client_name, number_client }) => {
        try {
            // Envia uma requisição POST para o Webhook do Discord com os dados formatados
            const response = await axios.post(`${process.env.DISCORD_WEBOOK}`, {
                embeds: [
                    {
                        type: "rich",
                        title: `Atenção: Logar no Opa! Suite da empresa ${nome_empresa ?? "Não informado"}`,
                        description: `${msg ?? "Não informado"}`,
                        color: 16711680, // Cor vermelha
                        thumbnail: {
                            "url": "https://em-content.zobj.net/source/noto-emoji-animations/344/police-car-light_1f6a8.gif",
                            "height": 0,
                            "width": 0
                        },
                        url: `${url_opa}`,
                        fields: [
                            {
                                "name": "CLIENTE",
                                "value": `\`${client_name ?? "Não informado"}\``,
                                "inline": true
                            },
                            {
                                "name": "NÚMERO",
                                "value": `\`${number_client ?? "Não informado"}\``,
                                "inline": true
                            },
                        ]
                    }
                ]
            });

            logger.debug(`Response from Discord: ${stringify(response)}`); // Loga a resposta do Discord

            return response;
        } catch (error) {
            logger.error(`Error sending message: ${error.message}`); // Loga o erro

            throw new Error('Error sending message'); // Retorna erro
        }
    }
}

// Exportando e já instânciando a classe
export const DiscordModel = new DISCORDModel();