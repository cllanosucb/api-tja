const express = require('express');
const moment = require('moment');
const fetch = (...args) =>
    import ('node-fetch').then(({ default: fetch }) => fetch(...args));
//conexion a mariaDb
const mariaDb = require('../db/mariadb');
require('dotenv').config();
const {
    validSchemaUsuarioInstructor,
} = require('../middleware/middleware')

const app = express();

app.get('', async(req, res) => {
    const user = await getUsuario(res, '10001');
    res.json(user);
})

/**
 * @swagger
 * components:
 *  schemas:
 *      usuario:
 *          type: object
 *          properties:
 *            lms_id_usuario:
 *              type: integer
 *              description: identificar del usuario generaro por la plataforma NEO lmsid
 *            doc_identidad:
 *              type: string
 *              description: Carnet de identidad de usuario
 *            ap_paterno:
 *              type: string
 *              description: Apellido paterno de usuario
 *            ap_materno:
 *              type: string
 *              description: Apellido materno de usuario
 *            nombres:
 *              type: string
 *              description: Nombre(s) del usuario
 *            sexo:
 *              type: string
 *              description: Sexo de usuario ej. Hombre, Mujer
 *            fecha_nacimiento:
 *              type: string
 *              description: Fecha de nacimiento de usuario
 *            email_personal:
 *              type: string
 *              description: Email persoanl de usuario
 *      status200:
 *          type: "object"
 *          properties:
 *            ok:
 *              type: "boolean"
 *              description: "Estado de la petición true = exitoso, false = fallido"
 *            datos_usuario:
 *              type: "object"
 *              properties:
 *                lms_id_usuario:
 *                  type: "integer"
 *                  description: "identificar del usuario generaro por la plataforma NEO lmsid"
 *                datos_correo: 
 *                  type: "string"
 *                  description: "JSON de los datos generados del correo institucional"
 *            procesos:
 *              type: "object"
 *              properties:
 *                insertInstructor:
 *                  type: "string"
 *                  description: "Cadena que indica el estado de la insersión a DB"
 *                usuario:
 *                  type: "string"
 *                  description: "JSON de los datos del usuario"
 *                updateUsuario:
 *                  type: "string"
 *                  description: "Cadena que indica el estado de la actualización a DB"
 *                updateUsuarioNeo:
 *                  type: "string"
 *                  description: "Cadena que indica el estado de la actualización en la plataforma NEO"
 *      statusError:
 *        type: "object"
 *        properties:
 *          ok:
 *            type: "boolean"
 *            description: "Estado de la petición true = exitoso, false = fallido"
 *          error: 
 *            type: "object"
 *            properties:
 *              mensaje:
 *                type: "string"
 *                description: "Mensaje de error"
 *              error:
 *                type: "string"
 *                description: "JSON del error obtenido"
 */

app.post('/generar/correo/institucional', validSchemaUsuarioInstructor, async(req, res) => {
    console.log('instructor/generar/correo/institucional');
    console.log('req.body', req.body);
    const { lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal } = req.body;
    try {
        const insertInstructor = await registrarInstructor(res, lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal)
        const usuario = await getUsuario(res, lms_id_usuario);

        console.log("email_institucional", usuario[0].email_institucional);
        if (usuario.length > 0 && usuario[0].email_institucional == null) {
            const respCorreo = await generarCorreoInstitucional(res, lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal);
            console.log("respCorreo", respCorreo);
            if (respCorreo.Response.IsSuccess) {
                const updateUsuario = await actualizarInstructor(res, respCorreo.Response.Result.Email, respCorreo.Response.Result.Password, lms_id_usuario);
                const updateUsuarioNeo = await actualizarEmailNeo(res, respCorreo.Response.Result.Email, lms_id_usuario);
                console.log('updateUsuario', updateUsuario);
                console.log('updateUsuarioNeo', updateUsuarioNeo);
                return res.json({
                    ok: true,
                    datos_usuario: {
                        lms_id_usuario,
                        datos_correo: respCorreo.Response.Result,
                    },
                    procesos: {
                        insertInstructor,
                        usuario,
                        updateUsuario,
                        updateUsuarioNeo
                    }
                })
            } else {
                return res.status(400).json({
                    ok: false,
                    error: {
                        mensaje: "Error al generar el correo institucional",
                        error: null,
                        error: respCorreo,
                        usuario
                    }
                });
            }
        } else {
            return res.status(400).json({
                ok: false,
                error: {
                    mensaje: "El usuario ya cuenta con correo institucional",
                    error: null,
                    insertInstructor,
                    usuario
                }
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            error: {
                mensaje: "Error interno en el servidor",
                error: err
            }
        });
    }
});

registrarInstructor = async(res, lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal) => {
    let conn;
    const querySelect = "select * from usuarios where (lms_id_usuario = ?)";
    const queryInsert = "INSERT INTO usuarios (lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal) VALUES (?,?,?,?,?,?,?,?);";
    let rowsInsert = 0;
    try {
        conn = await mariaDb.mariaDbConnection();
        const rowsSelect = await conn.query(querySelect, [lms_id_usuario]);
        if (rowsSelect.length == 0) {
            const rows = await conn.query(queryInsert, [lms_id_usuario, doc_identidad, ap_paterno.toUpperCase(), ap_materno.toUpperCase(), nombres.toUpperCase(), sexo.toUpperCase(), fecha_nacimiento, email_personal]);
            rowsInsert = rows.affectedRows;
        }
        return rowsInsert;
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: {
                mensaje: "Error interno en el servidor",
                error: err
            }
        });
    } finally {
        if (conn) {
            conn.release();
            return rowsInsert
        }
    }
}

getUsuario = async(res, lms_id_usuario) => {
    let conn;
    let rows = [];
    try {
        conn = await mariaDb.mariaDbConnection();
        const query = "select * from usuarios where (lms_id_usuario = ?)";
        rows = await conn.query(query, [lms_id_usuario]);
        // console.log(rows);
        return rows;
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: {
                mensaje: "Error interno en el servidor",
                error: err
            }
        });
    } finally {
        if (conn) {
            conn.release();
            return rows
        }
    }
}

generarCorreoInstitucional = async(res, lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal) => {
    const params = emailParams(lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal);
    console.log(JSON.stringify(params));
    try {
        const gsuitaccount = await fetch(process.env.URL_BACKEND_UCB, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                // 'Access-Control-Allow-Origin': '*',
                'Token': process.env.TOKEN_BACKEND_UCB,
                'ClientCode': 'CREATE-ACCOUNT'
            },
            body: JSON.stringify(params)
        });
        // console.log(gsuitaccount);
        const datos = await gsuitaccount.json();
        // console.log("datos", datos);
        return datos;
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: {
                mensaje: "Error interno en el servidor",
                error: err
            }
        });
    }
}

actualizarInstructor = async(res, email_institucional, password, lms_id_usuario) => {
    let conn;
    const queryUpdate = "UPDATE usuarios SET email_institucional = ?, password = ? WHERE lms_id_usuario = ?;";
    let rowsUpdate = 0
    try {
        conn = await mariaDb.mariaDbConnection();
        const updateDb = await conn.query(queryUpdate, [email_institucional, password, lms_id_usuario]);
        console.log("updateDb", updateDb);
        rowsUpdate = updateDb.affectedRows;
        return rowsUpdate;
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: {
                mensaje: "Error interno en el servidor",
                error: err
            }
        });
    } finally {
        if (conn) {
            conn.release();
            return rowsUpdate
        }
    }
}

actualizarEmailNeo = async(res, email_institucional, lms_id_usuario) => {
    try {
        const response = await fetch(`${process.env.URL}/update_user?api_key=${process.env.API_KEY}&id=${lms_id_usuario}&email=${email_institucional}`);
        const updateuserneo = await response.json();
        return updateuserneo
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: {
                mensaje: "Error interno en el servidor",
                error: err
            }
        });
    }
}

emailParams = (lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal) => {
    const date = new Date(fecha_nacimiento);
    // console.log(moment(date.toISOString()).format('L'));
    const params = {
        Parametros: {
            Encrypted: "0",
            NsPersona: "81" + lms_id_usuario,
            NsRegional: "81",
            NsPrograma: "817721",
            NsPeriodo: "817721",
            ApPaterno: "" + ap_paterno.toUpperCase(),
            ApMaterno: "" + ap_materno != undefined ? ap_materno.toUpperCase() : "",
            Nombres: "" + nombres.toUpperCase(),
            Sexo: "" + sexo.toUpperCase() == 'HOMBRE' ? "1" : "2",
            Listas: "",
            Alias: "",
            Tipo: "5",
            EmailPersonal: "" + email_personal,
            DocIdentidad: "" + doc_identidad,
            Cargo: "",
            FechaNacimiento: `${fecha_nacimiento != undefined ? moment(fecha_nacimiento).format('DD/MM/YYYY') : '' }`,
            DepartamentoAcademico: "",
            Celular: ""
        }
    };
    return params;
}

module.exports = app;