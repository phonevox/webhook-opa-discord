export const addIPSchema = {
    body: {
        type: 'object',
        required: ['ip'],
        properties: {
            ip: { type: 'string', minLength: 1, maxLength: 255 }
        }
    },
};

export const editIPSchema = {
    body: {
        type: 'object',
        required: ['old_ip', 'new_ip'],
        properties: {
            old_ip: { type: 'string', minLength: 1, maxLength: 255 },
            new_ip: { type: 'string', minLength: 1, maxLength: 255 }
        }
    },
};

export const deleteIPSchema = {
    body: {
        type: 'object',
        required: ['ip'],
        properties: {
            ip: { type: 'string', minLength: 1, maxLength: 255 }
        }
    },
};
