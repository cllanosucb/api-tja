const express = require('express')
const app = express()

app.use('/persona', require('./persona'));
app.use('/materia', require('./materia'));

module.exports = app;