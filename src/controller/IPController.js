import { updateAllowedIPs, checkIsAdmin } from "../utils/cache.js";
import { isValidIP, resolveDomainToIP } from "../utils/functions.js";
import { logger } from "../utils/logger.js";
import { logRequestAndResponse } from "../utils/loggerFunctions.js";
import { IpModel } from "../models/IPModel.js";

class IPController {
    create = async (request, reply) => {
        try {
            // Somente os IPS permitidos podem acessar essa rota, está configurado no .env!
            await checkIsAdmin(request, reply)

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

            const newIP = await IpModel.create({ allowedIps, ipToAdd });

            const responseData = {
                message: 'IP added successfully',
                ip: newIP
            };

            logRequestAndResponse(request, reply, responseData); // Loga a requisição e resposta

            return reply.status(200).send(responseData); // Envia a resposta corretamente
        } catch (erro) {
            logger.error(`Error adding IP: ${erro.message}`);

            return reply.status(500).send({ error: 'Failed to add IP' });
        }
    }

    getAll = async (request, reply) => {
        try {
            // Verifica se o usuário tem permissões administrativas
            await checkIsAdmin(request, reply);

            // Obtém os IPs permitidos do modelo
            const allowedIps = await IpModel.getAll(request);

            // Prepara os dados de resposta
            const responseData = {
                allowed_ips: allowedIps.length > 0 ? allowedIps : [],
            };

            // Loga a requisição e a resposta
            logRequestAndResponse(request, reply, responseData);

            // Retorna a resposta
            return reply.status(200).send(responseData);
        } catch (err) {
            // Loga o erro e retorna uma resposta de erro
            logger.error("Error getting allowed IPs:", err);
            return reply.status(500).send({ error: "Internal Server Error" });
        }
    }

    edit = async (request, reply) => {
        try {
            // Verifica permissões administrativas
            await checkIsAdmin(request, reply);

            const { old_ip, new_ip } = request.body;

            let resolvedOldIP = old_ip;
            let resolvedNewIP = new_ip;

            // Resolve domínios para IPs, se necessário
            if (!isValidIP(old_ip)) {
                resolvedOldIP = await resolveDomainToIP(old_ip);
            }
            if (!isValidIP(new_ip)) {
                resolvedNewIP = await resolveDomainToIP(new_ip);
            }

            const allowedIPs = request.ip_allowed || [];

            // Verifica se o IP antigo existe
            const ipEntry = allowedIPs.find(entry => entry.ip === resolvedOldIP);
            if (!ipEntry) {
                return reply.code(404).send({ error: 'Old IP not found' });
            }

            // Verifica se o novo IP já existe
            if (allowedIPs.some(entry => entry.ip === resolvedNewIP)) {
                return reply.code(400).send({ error: 'New IP already exists' });
            }

            // Atualiza o IP na lista
            ipEntry.ip = resolvedNewIP;

            // Chama o modelo para atualizar a lista
            const updatedIPs = await IpModel.edit({
                allowedIPs,
                old_ip: resolvedOldIP,
                new_ip: resolvedNewIP,
            });

            const responseData = {
                success: true,
                message: 'IP updated successfully',
                allowed_ips: updatedIPs, // Inclui a lista atualizada
            };

            logRequestAndResponse(request, reply, responseData);

            return reply.status(200).send(responseData);
        } catch (err) {
            logger.error(`Error editing IP: ${err.message}`);
            return reply.status(500).send({ error: 'Failed to edit IP' });
        }
    };

    delete = async (request, reply) => {
        try {
            // Verifica se o usuário tem permissões administrativas
            await checkIsAdmin(request, reply);

            const { ip } = request.body;
            let ipToRemove = ip;

            // Resolve o domínio para IP, se necessário
            if (!isValidIP(ip)) {
                try {
                    logger.info(`IP is a domain, resolving ${ip} to IP...`);
                    ipToRemove = await resolveDomainToIP(ip);
                    logger.info(`Domain ${ip} resolved to IP: ${ipToRemove}`);
                } catch (error) {
                    logger.error(`Error resolving domain: ${ip}. Error: ${error.message}`);
                    return reply.status(400).send({ error: `Invalid domain: ${ip}. Error: ${error.message}` });
                }
            }

            // Obtém a lista de IPs permitidos
            const allowedIPs = request.ip_allowed || [];
            logger.info(`Current allowed IPs: ${JSON.stringify(allowedIPs)}`);

            // Verifica se o IP existe na lista
            if (!allowedIPs.some(entry => entry.ip === ipToRemove)) {
                logger.warn(`IP not found in the allowed list: ${ipToRemove}`);
                return reply.status(404).send({ error: 'IP not found' });
            }

            // Remove o IP usando o model
            const newAllowedIPs = await IpModel.delete({ ipToRemove, allowedIPs });

            const responseData = {
                success: true,
                message: 'IP deleted',
                updatedList: newAllowedIPs,
            };

            // Loga a requisição e a resposta
            logRequestAndResponse(request, reply, responseData);

            return reply.status(200).send(responseData);
        } catch (err) {
            logger.error(`Error deleting IP: ${err.message}`);
            return reply.status(500).send({ error: 'Failed to delete IP' });
        }
    }
}

// Exportando e já instânciando a classe
export const IpController = new IPController();