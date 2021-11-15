const {
    schemaAuth,
    schemaUsuario,
    schemaInscripcion,
    schemaMateria,
    schemaInscripcionEstudiante
} = require('../schema/schemas');

let validSchemaAuth = async(req, res, next) => {

    try {
        let valid = await schemaAuth.isValid(req.body)
        let dataValidate = await schemaAuth.validate(req.body)
        console.log("Resultado Validate ", dataValidate);
        console.log("Validacion de Datos Body ", valid);
        if (!valid) {
            res.status(400).json({
                err: "error"
            })
        }
        next();

    } catch (error) {
        res.json({
            error
        })
    }
}

let validSchemaUsuario = async(req, res, next) => {

    try {
        let valid = await schemaUsuario.isValid(req.body)
        let dataValidate = await schemaUsuario.validate(req.body)
        console.log("Resultado Validate ", dataValidate);
        console.log("Validacion de Datos Body ", valid);
        if (!valid) {
            res.status(400).json({
                err: "error"
            })
        }
        next();

    } catch (error) {
        res.json({
            error
        })
    }
}

let validSchemaInscripcion = async(req, res, next) => {

    try {
        let valid = await schemaInscripcion.isValid(req.body)
        let dataValidate = await schemaInscripcion.validate(req.body)
        console.log("Resultado Validate ", dataValidate);
        console.log("Validacion de Datos Body ", valid);
        if (!valid) {
            res.status(400).json({
                err: "error"
            })
        }
        next();

    } catch (error) {
        res.json({
            error
        })
    }
}

let validSchemaInscripcionEstudiante = async(req, res, next) => {

    try {
        let valid = await schemaInscripcionEstudiante.isValid(req.body)
        let dataValidate = await schemaInscripcionEstudiante.validate(req.body)
        console.log("Resultado Validate ", dataValidate);
        console.log("Validacion de Datos Body ", valid);
        if (!valid) {
            res.status(400).json({
                err: "error"
            })
        }
        next();

    } catch (error) {
        res.json({
            error
        })
    }
}

let validSchemaMateria = async(req, res, next) => {

    try {
        let valid = await schemaMateria.isValid(req.body)
        let dataValidate = await schemaMateria.validate(req.body)
        console.log("Resultado Validate ", dataValidate);
        console.log("Validacion de Datos Body ", valid);
        if (!valid) {
            res.status(400).json({
                err: "error"
            })
        }
        next();

    } catch (error) {
        res.json({
            error
        })
    }
}


module.exports = {
    validSchemaAuth,
    validSchemaUsuario,
    validSchemaInscripcion,
    validSchemaMateria,
    validSchemaInscripcionEstudiante
}