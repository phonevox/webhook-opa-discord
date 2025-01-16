# Webhook-opa-discord
Este repositório fornece uma API para integração com webhook do Discord para empresas utilizarem e um CRUD para gerenciar IPs permitidos que só é acessivel de uma rede permitida, com cache e controle de acesso.

### Requisitos
Node.js 22.x (recomendado usar o Alpine para produção)

## Como Clonar o Repositório
#### Repositório Público

Clone o repositório público com o seguinte comando:

`git clone https://github.com/phonevox/webhook-opa-discord`

#### Repositório Privado
Se você tiver acesso ao repositório privado, use o seguinte comando:

`git clone git@github.com:phonevox/webhook-opa-discord.git`

## Instalação
Após clonar o repositório, instale as dependências com o comando:

`npm install`
Configure as variáveis de ambiente no arquivo `.env`.

## Variáveis de Ambiente
As variáveis de ambiente necessárias são:


`LOG_CONFIG_LEVEL -> Define o nível de log da aplicação. Opções: info, debug, warn, error, critical.`

`FIXED_ALLOWED_IPS: Lista de IPs fixos da Phonevox com permissão para o CRUD.`

`DISCORD_WEBHOOK: URL do webhook do Discord.`

`TIME_CACHE: Tempo de cache do IP em segundos.`

`TIME_HIT_CACHE: Tempo para validar se os dados do cache não expiraram.`

Exemplo de arquivo .env:

````bash
LOG_CONFIG_LEVEL=info
FIXED_ALLOWED_IPS=192.168.0.1,192.168.0.2
DISCORD_WEBHOOK=https://discord.com/api/webhooks/your-webhook-url
TIME_CACHE=3600
TIME_HIT_CACHE=600
````

## Como Rodar a API
Execute o comando abaixo para iniciar a API:

`node server.js`

Pronto! Sua API estará rodando e pronta para uso.

## Documentação das Rotas
A documentação completa das rotas está disponível no Postman:

Docs das Rotas: https://documenter.getpostman.com/view/29189696/2sAYQZHs9y

## OBS:
Não testado blocos de IP's, apenas IPs únicos, aceita domínios, porém, a aplicação converte para IP.

## Contribuidores:

<a href="https://www.linkedin.com/in/rafael-rizzo-breschi-b02547216/" target="_blank">Rafael Rizzo</a>

<a href="https://www.linkedin.com/in/adrian-kubinyete-a35346291/" target="_blank">Adrian Kubinyete</a>

