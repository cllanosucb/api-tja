const path = require('path');

const swaggerSpec = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Documentación de la API REST",
            version: "1.0.0",
            description: "Este es un servidor de API REST para la generación de correos institucionales con sub-dominio @online.ucb.edu.bo @ucb.edu.bo.",
            contact: {
                name: "API Support",
                email: "cllanos@ucb.edu.bo"
            }
        },
        servers: [{
                url: "http://localhost:3000"
            },
            {
                url: "http://dev1.tja.ucb.edu.bo"
            }
        ]
    },
    apis: [`${path.join(__dirname, './swagger.yaml')}`]
}

module.exports = swaggerSpec;