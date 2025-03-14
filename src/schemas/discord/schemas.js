export const sendMessageSchema = {
    body: {
        type: 'object',
        required: ['url_opa', 'nome_empresa', 'client_name', 'number_client', 'msg'],
        properties: {
            url_opa: { type: 'string', minLength: 1, maxLength: 255 },
            nome_empresa: { type: 'string', minLength: 1, maxLength: 200 },
            client_name: { type: 'string', minLength: 1, maxLength: 255 },
            number_client: { type: 'string', minLength: 1, maxLength: 255 },
            msg: { type: 'string', minLength: 1, maxLength: 2000 }
        }
    },
};
