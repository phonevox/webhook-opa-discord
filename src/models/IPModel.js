import { stringify } from "flatted";
import { getAllowedIPs, updateAllowedIPs } from "../utils/cache.js";
import { logger } from "../utils/logger.js";

class IPModel {
    create = async ({ allowedIps, ipToAdd }) => {
        try {
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

            return newIP;
        } catch (err) {
            logger.error("Error creating IP:", err);
            throw new Error(`Error creating IP: ${err.message}`);
        }

    }

    getAll = async (request) => {
        try {
            // Obtém os IPs permitidos da cache
            const allowedIps = getAllowedIPs(request);
            logger.info(`Fetched allowed IPs: ${stringify(allowedIps)}`);

            return allowedIps;
        } catch (err) {
            // Loga o erro e lança uma exceção
            logger.error("Error fetching allowed IPs:", err);
            throw new Error(`Error fetching allowed IPs: ${err.message}`);
        }
    }

    edit = async ({ allowedIPs, resolvedOldIP, resolvedNewIP }) => {
        try {
            // Substitui o IP antigo pelo novo na lista
            const updatedIPs = allowedIPs.map(entry => {
                if (entry.ip === resolvedOldIP) {
                    return { ...entry, ip: resolvedNewIP }; // Atualiza somente o IP correspondente
                }
                return entry; // Mantém os demais IPs intactos
            });

            // Atualiza a lista no cache ou arquivo
            updateAllowedIPs(updatedIPs);

            logger.info(`Updated allowed IPs list: ${JSON.stringify(updatedIPs)}`);
            return updatedIPs; // Retorna a lista atualizada
        } catch (err) {
            logger.error(`Failed to update allowed IPs:`, err);
            throw new Error(`Failed to update allowed IPs: ${err.message}`);
        }
    };


    delete = async ({ ipToRemove, allowedIPs }) => {
        try {
            // Filtra os IPs, removendo o IP especificado
            const newAllowedIPs = allowedIPs.filter(entry => entry.ip !== ipToRemove);

            // Atualiza o cache ou arquivo com a nova lista de IPs permitidos
            updateAllowedIPs(newAllowedIPs);

            logger.info(`IP ${ipToRemove} removed successfully. Updated list: ${JSON.stringify(newAllowedIPs)}`);
            return newAllowedIPs;
        } catch (err) {
            logger.error(`Failed to delete IP: ${ipToRemove}`, err);
            throw new Error(`Failed to delete IP: ${err.message}`);
        }

    }
}

// Exportando e já instânciando a classe
export const IpModel = new IPModel();