import { updateAllowedIPs, verifyClientIPAdmin } from "../utils/cache.js";
import { isValidIP, resolveDomainToIP } from "../utils/functions.js";
import { logger } from "../utils/logger.js";
import { logRequestAndResponse } from "../utils/loggerFunctions.js";

class IPController {
    create = async (request, reply) => {
        // Somente os IPS permitidos podem acessar essa rota, está configurado no .env!
        try {
            const response = verifyClientIPAdmin(request, reply);

            logger.info("Response from verifyClientIPAdmin:", response);
            logger.info("Continuing with getAll method");
        } catch (error) {
            logger.error("Error in getAll method:", error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }

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

        return reply.status(200).send(responseData); // Envia a resposta corretamente
    }

    getAll = async (request, reply) => {

        // Somente os IPS permitidos podem acessar essa rota, está configurado no .env!
        try {
            const response = verifyClientIPAdmin(request, reply);

            logger.info("Response from verifyClientIPAdmin:", response);
            logger.info("Continuing with getAll method");
        } catch (error) {
            logger.error("Error in getAll method:", error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }

        let responseData = {
            allowed_ips: request.ip_allowed // Retorna a lista de IPs permitidos
        };

        // Se a lista de IPs permitidos estiver vazia, podemos adicionar uma verificação
        if (request.ip_allowed.length === 0) {
            responseData = { allowed_ips: [] }; // Caso não haja IPs permitidos, retorna uma lista vazia
        }

        logRequestAndResponse(request, reply, responseData); // Loga a requisição e resposta

        return reply.status(200).send(responseData);
    };

    edit = async (request, reply) => {
        // Somente os IPS permitidos podem acessar essa rota, está configurado no .env!
        try {
            const response = verifyClientIPAdmin(request, reply);

            logger.info("Response from verifyClientIPAdmin:", response);
            logger.info("Continuing with getAll method");
        } catch (error) {
            logger.error("Error in getAll method:", error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }

        const { old_ip, new_ip } = request.body; // Obtém o IP antigo e o novo
        let resolvedOldIP = old_ip;
        let resolvedNewIP = new_ip;

        // Verifica se o old_ip é válido
        if (!isValidIP(old_ip)) {
            try {
                resolvedOldIP = await resolveDomainToIP(old_ip); // Resolve o domínio para IP
                logger.info(`Resolved old domain ${old_ip} to IP: ${resolvedOldIP}`);
            } catch (err) {
                logger.error(`Error resolving old domain: ${old_ip}`, err);
                return reply.code(400).send({ error: 'Invalid old IP or domain' });
            }
        }

        // Verifica se o new_ip é válido
        try {
            if (!isValidIP(new_ip)) {
                resolvedNewIP = await resolveDomainToIP(new_ip); // Resolve o domínio para IP
                logger.info(`Resolved new domain ${new_ip} to IP: ${resolvedNewIP}`);
            }
        } catch (err) {
            logger.error(`Error resolving new domain: ${new_ip}`, err);
            return reply.code(400).send({ error: 'Invalid new IP or domain' });
        }

        const allowedIPs = request.ip_allowed || []; // Garante que a lista existe
        logger.info("Allowed IPs list:", allowedIPs);

        // Verifica se o old_ip e new_ip são iguais
        if (resolvedOldIP === resolvedNewIP) {
            logger.warn(`Old IP and New IP are the same: ${resolvedOldIP}`);
            return reply.code(400).send({ error: 'Old IP and New IP cannot be the same' });
        }

        // Verifica se o new_ip já existe na lista de allowedIPs
        const ipExists = allowedIPs.some(entry => entry.ip === resolvedNewIP);
        if (ipExists) {
            logger.warn(`New IP already exists in the allowed list: ${resolvedNewIP}`);
            return reply.code(400).send({ error: 'New IP already exists in the allowed list' });
        }

        // Localiza o IP antigo e atualiza
        const ipEntry = allowedIPs.find(entry => entry.ip === resolvedOldIP);

        if (!ipEntry) {
            logger.error(`Old IP not found: ${resolvedOldIP}`);
            return reply.code(404).send({ error: 'Old IP not found' });
        }

        // Atualiza o IP
        ipEntry.ip = resolvedNewIP;

        try {
            // Atualiza a lista de IPs permitidos
            updateAllowedIPs(allowedIPs);
        } catch (err) {
            logger.error(`Failed to update allowed IPs`, err);
            return reply.code(500).send({ error: 'Failed to update IP list' });
        }

        const responseData = {
            success: true,
            message: "IP updated successfully",
            updatedIP: resolvedNewIP,
        };

        logRequestAndResponse(request, reply, responseData); // Loga a requisição e resposta

        return reply.code(200).send(responseData); // Retorna sucesso
    };

    delete = async (request, reply) => {
        // Somente os IPS permitidos podem acessar essa rota, está configurado no .env!
        try {
            const response = verifyClientIPAdmin(request, reply);

            logger.info("Response from verifyClientIPAdmin:", response);
            logger.info("Continuing with getAll method");
        } catch (error) {
            logger.error("Error in getAll method:", error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }

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

        return reply.send(responseData); // Envia a resposta corretamente
    }
}

// Exportando e já instânciando a classe
export const IpController = new IPController();