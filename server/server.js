require('./config/config');
require('dotenv').config();
const { job_inscripcion } = require('./tools/jobs');
const CronJob = require('cron').CronJob;
const path = require('path');
const fs = require('fs');
const express = require('express');
// swagger
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
// console.log(path.join('server', 'api.yaml'));
const swaggerJsDoc = YAML.load('api.yaml');
// const swaggerJsDoc = YAML.load(fs.readFileSync('server/api.yaml', 'utf8'));

const app = express();
var job = new CronJob(process.env.CRON_TIME1, job_inscripcion);
job.start();
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))
    // parse application/json
app.use(express.json())
    //Configuracion global de rutas
app.use('/api', require('./routes/index'));
// middlewares swagger
app.use('/api-doc', swaggerUI.serve, swaggerUI.setup(swaggerJsDoc));

app.get('/', (req, res) => {
    res.json({
        msg: "Servidor iniciado"
    });
})

app.listen(process.env.PORT, () => {
    console.log("Escuchando puerto: ", process.env.PORT);
})