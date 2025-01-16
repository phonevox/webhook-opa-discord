import { isIP } from 'net';
import dns from 'dns';

// Função para resolver o domínio para IP
export const resolveDomainToIP = async (domain) => {
    return new Promise((resolve, reject) => {
        dns.lookup(domain, { family: 4 }, (err, address) => {
            if (err) {
                reject(new Error(`Unable to resolve domain: ${domain} - Error: ${err.message}`));
            } else {
                resolve(address);
            }
        });
    });
};
//  Função para verificar se o valor é um IP válido
export const isValidIP = (ipAddress) => {
    return isIP(ipAddress); // Retorna 4 para IPv4 ou 6 para IPv6, 0 para inválido
};