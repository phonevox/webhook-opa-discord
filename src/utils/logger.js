// Por algum motivo que não entendi o dotenv estava demorando para ser carregado, acarretando com que a variavel de ambiente LOG_CONFIG_LEVEL não fosse carregada, então fiz o carregamento do dotenv aqui também...
import dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis de ambiente do .env

import winston from 'winston';
import path from 'path';
import moment from 'moment-timezone';
import DailyRotateFile from 'winston-daily-rotate-file';  // Importa o transporte de rotação de arquivos

// Configura o caminho para o arquivo de log
const logPath = path.resolve('logs');  // Coloca os logs em uma pasta 'logs'

// Cria a instância do logger do Winston com timezone ajustado
export const logger = winston.createLogger({
    level: process.env.LOG_CONFIG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: () => moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss') // Ajusta para o fuso horário correto
        }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        // Console transport com formatação colorida
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),

        // Rotação de arquivos diários
        new DailyRotateFile({
            filename: path.join(logPath, 'server-%DATE%.log'),  // Caminho e padrão de nome de arquivo com data
            datePattern: 'YYYY-MM-DD',  // Define o formato da data no nome do arquivo
            zippedArchive: true,  // Arquivos antigos serão compactados
            maxSize: '20m',  // Tamanho máximo do arquivo antes de criar um novo (20MB)
            maxFiles: '14d'  // Quantos dias de logs manter (logs mais antigos serão deletados)
        })
    ]
});
