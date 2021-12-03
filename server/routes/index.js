const express = require('express')
const app = express()

app.use('/persona', require('./persona'));
app.use('/materia', require('./materia'));
app.use('/instructor', require('./instructor'))
    // app.use('/instructor', require('./instructor'));

module.exports = app;