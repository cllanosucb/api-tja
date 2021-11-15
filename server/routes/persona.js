const express = require('express');
const jwt = require('jsonwebtoken');
const fetch = (...args) =>
    import ('node-fetch').then(({ default: fetch }) => fetch(...args));
const db = require('../db/connection_db');
require('dotenv').config();

const {
    validSchemaAuth,
    validSchemaUsuario,
    validSchemaInscripcion,
    validSchemaInscripcionEstudiante
} = require('../middleware/middleware')

const app = express();

app.get('/', async(req, res) => {

    sql = 'SELECT * FROM personas WHERE doc_identidad = :id';
    // db.getEmployee(7209948);
    const binds = [7209948];
    //db.open(sql, [id], false, res);
    const result = await db.query(sql, binds, false);
    res.json(result.rows[0])
})

app.post('/auth', validSchemaAuth, async(req, res) => {
    const body = req.body;
    const sql = 'SELECT * FROM PERSONAS WHERE doc_identidad = :doc_identidad';
    const binds = [body.doc_identidad];

    const resultdb = await db.query(sql, binds, false);
    // console.log("Resultado",resultdb);

    if (!resultdb.status) {
        res.status(500).json({
            ok: false,
            err: {
                msg: "Error interno en el Servidor",
                error: resultdb.err
            }
        })
    } else {
        if (resultdb.result.rows.length == 0) {
            res.status(400).json({
                ok: false,
                err: {
                    msg: "Usuario no encontrado / Usuario no registrado"
                }
            });
        }
        let token = jwt.sign({
            persona: resultdb.result.rows[0]
        }, 'secret-unico');
        res.json({
            ok: true,
            persona: resultdb.result.rows[0],
            token
        });
    }
})

app.post('/registro', validSchemaUsuario, async(req, res) => {
    const { doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email, lms_id } = req.body;
    let TIPO = 2;
    let DOC_IDENTIDAD = parseInt(doc_identidad.replace(/[^0-9]/g, ""));
    let TIPO_DOC = 1;
    let AP_PATERNO = ap_paterno.toUpperCase();
    let AP_MATERNO = ap_materno.toUpperCase() || '';
    let NOMBRES = nombres.toUpperCase();
    let SEXO = sexo.toUpperCase() == 'HOMBRE' ? 1 : 2;
    let FECHA_NACIMIENTO = fecha_nacimiento
    let CEDULA_IDENTIDAD = doc_identidad
    let EMAIL = email;
    let LMS_ID = lms_id;
    const sqlexiste = 'SELECT * FROM PERSONAS WHERE doc_identidad = :doc_identidad';
    const sqlinsertuser = "DECLARE " +
        `x_num_sec NUMBER; ` +
        `BEGIN ` +
        `INSERT INTO PERSONAS(TIPO, DOC_IDENTIDAD, TIPO_DOC, AP_PATERNO, AP_MATERNO, NOMBRES, SEXO, FECHA_NACIMIENTO, CEDULA_IDENTIDAD)VALUES (${TIPO}, ${DOC_IDENTIDAD}, ${TIPO_DOC}, '${AP_PATERNO}', '${AP_MATERNO}', '${NOMBRES}', ${SEXO}, to_date('${FECHA_NACIMIENTO}', 'YYYY-MM-DD'), '${CEDULA_IDENTIDAD}'); ` +
        `SELECT NUM_SEC INTO x_num_sec ` +
        `FROM PERSONAS ` +
        `WHERE DOC_IDENTIDAD = ${DOC_IDENTIDAD}; ` +
        `INSERT INTO USUARIOS_UCB_ONLINE (NUM_SEC, DOC_IDENTIDAD, AP_PATERNO, AP_MATERNO, NOMBRES, SEXO, FECHA_NACIMIENTO, CEDULA_IDENTIDAD, EMAIL, LMS_ID)VALUES (x_num_sec, ${DOC_IDENTIDAD}, '${AP_PATERNO}', '${AP_MATERNO}', '${NOMBRES}', ${SEXO}, to_date('${FECHA_NACIMIENTO}', 'YYYY-MM-DD'), '${CEDULA_IDENTIDAD}', '${EMAIL}', ${LMS_ID}); ` +
        `COMMIT; ` +
        `END;`;
    const sqlinsertucbonline = `DECLARE ` +
        `data NUMBER; ` +
        `x_num_sec NUMBER; ` +
        `BEGIN ` +
        `SELECT COUNT(*) INTO data ` +
        `FROM USUARIOS_UCB_ONLINE ` +
        `WHERE DOC_IDENTIDAD = ${DOC_IDENTIDAD}; ` +
        `IF data = 0 THEN ` +
        `SELECT NUM_SEC INTO x_num_sec ` +
        `FROM PERSONAS ` +
        `WHERE DOC_IDENTIDAD = ${DOC_IDENTIDAD}; ` +
        `INSERT INTO USUARIOS_UCB_ONLINE (NUM_SEC, DOC_IDENTIDAD, AP_PATERNO, AP_MATERNO, NOMBRES, SEXO, FECHA_NACIMIENTO, CEDULA_IDENTIDAD, EMAIL, LMS_ID)VALUES (x_num_sec, ${DOC_IDENTIDAD}, '${AP_PATERNO}', '${AP_MATERNO}', '${NOMBRES}', ${SEXO}, to_date('${FECHA_NACIMIENTO}', 'YYYY-MM-DD'), '${CEDULA_IDENTIDAD}', '${EMAIL}', ${LMS_ID}); ` +
        `COMMIT; ` +
        `END IF ;` +
        `END;`;
    const existe = await db.query(sqlexiste, [DOC_IDENTIDAD], true);
    if (!existe.status) {
        return error(res, existe);
    } else {
        if (existe.result.rows.length > 0) {
            const insertuserucb = await db.query(sqlinsertucbonline, [], true);
            console.log("insertuserucb ", insertuserucb);
            if (insertuserucb.status) {
                return success(res, insertuserucb);
            } else {
                return error(res, insertuserucb);
            }
        }
        const insertPersonas = await db.query(sqlinsertuser, [], true);
        console.log("insertPersonas ", insertPersonas);
        if (!insertPersonas.status) {
            return error(res, insertPersonas);
        } else {
            return success(res, insertPersonas);
        }
    }

})

/*app.post('/inscripcion', validSchemaInscripcion, async(req, res) => {
    const { lms_id_materia, lms_id_usuario, num_sec_servicio } = req.body;
    const urlgsuitiaccount = "https://backend.cba.ucb.edu.bo/WebApi/api/DwUcb/Procesos/GSuiteAccount/CrearAllOnLine";
    const bindspago = [lms_id_usuario, num_sec_servicio];
    const sqlpago = "SELECT * FROM PAGOS p, USUARIOS_UCB_ONLINE u WHERE ( u.LMS_ID = :LMS_ID_USUARIO AND p.NUM_SEC_USUARIO = u.NUM_SEC AND NUM_SEC_SERVICIO = :NUM_SEC_SERVICIO AND ESTADO = 1)";
    const sqlupdate = "UPDATE USUARIOS_UCB_ONLINE SET EMAIL_INSTITUCIONAL = :EMAIL_INSTITUCIONAL, PASSWORD_INSTITUCIONAL = :PASSWORD WHERE LMS_ID = :LMS_ID_USUARIO";
    const sqlinscripcion = `DECLARE ` +
        `data NUMBER; ` +
        `BEGIN ` +
        `SELECT COUNT(*) INTO data FROM INSCRIPCION_UCB_ONLINE WHERE (LMS_ID_USUARIO = ${lms_id_usuario} AND LMS_ID_MATERIA = ${lms_id_materia}); ` +
        `IF data = 0 THEN ` +
        `INSERT INTO INSCRIPCION_UCB_ONLINE (LMS_ID_USUARIO, LMS_ID_MATERIA) VALUES (${lms_id_usuario}, ${lms_id_materia}); ` +
        `COMMIT; ` +
        `END IF; ` +
        `END;`;

    const pago = await db.query(sqlpago, bindspago, true);
    if (!pago.status) {
        return error(res, pago);
    } else if (pago.result.rows.length > 0) {
        //Verificar si tiene email online.ucb.edu.bo
        if (pago.result.rows[0].EMAIL_INSTITUCIONAL == null) {
            console.log(pago.result.rows[0].EMAIL_INSTITUCIONAL == null);
            console.log(gsuitparams(pago.result.rows[0]));
            const params = gsuitparams(pago.result.rows[0]);
            const gsuitaccount = await fetch(urlgsuitiaccount, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': 'IvPhkLXSxwmUrFKOP9MLne2kX0AabdRqHO37OV0V6S1Nw6t2EGr0B3bdeUf2Gkuaq77ZlMijbxtiXP7Q/TtlzQ==',
                    'ClientCode': 'CREATE-ACCOUNT'
                },
                body: JSON.stringify(params)
            });
            if(gsuitaccount.ok){
                const account = await gsuitaccount.json();
                const response = await fetch(`${process.env.URL}/update_user?api_key=${process.env.API_KEY}&id=${lms_id_usuario}&email=${account.Response.Result.Email}`);
                const updateuserneo = await response.json();
                const userupdate = await db.query(sqlupdate, [account.Response.Result.Email, account.Response.Result.Password, lms_id_usuario] , true);
                console.log("updateuserneo", updateuserneo);
                console.log("userupdate", userupdate);
            }

        }
        //inscripcion a neo y registro en DB
        const inscripcion = await db.query(sqlinscripcion, [], true);
        if (inscripcion.status) {
            const response = await fetch(`${process.env.URL}/reactivate_students_in_class?api_key=${process.env.API_KEY}&class_id=${lms_id_materia}&user_ids=${lms_id_usuario}`);
            const inscripcion_neo = await response.json();
            return res.json({
                ok: true,
                data: inscripcion,
                inscripcion_neo
            })
        } else {
            return error(res, inscripcion);
        }
    }
})*/

app.post('/habilitar/estudiante/ucbonline', validSchemaInscripcionEstudiante, async(req, res) => {
    const { num_sec_usuario, num_sec_servicio } = req.body;
    const urlgsuitiaccount = "https://backend.cba.ucb.edu.bo/WebApi/api/DwUcb/Procesos/GSuiteAccount/CrearAllOnLine";
    const bindsusuarioandmateria = [num_sec_usuario, num_sec_servicio];
    const sqlusuarioandmateria = "SELECT u.*, m.NUM_SEC_SERVICIO, m.NOMBRE as NOM_MATERIA, m.LMS_ID as LMS_ID_MATERIA FROM USUARIOS_UCB_ONLINE u, MATERIAS_UCB_ONLINE m WHERE (u.NUM_SEC = :NUM_SEC_USUARIO AND m.NUM_SEC_SERVICIO = :NUM_SEC_SERVICIO)"
    const sqlupdate = "UPDATE USUARIOS_UCB_ONLINE SET EMAIL_INSTITUCIONAL = :EMAIL_INSTITUCIONAL, PASSWORD_INSTITUCIONAL = :PASSWORD WHERE LMS_ID = :LMS_ID_USUARIO";

    const user = await db.query(sqlusuarioandmateria, bindsusuarioandmateria, true);
    if (!user.status) {
        return error(res, user);
    } else if (user.result.rows.length > 0) {
        // console.log(user.result);
        //Verificar si tiene email online.ucb.edu.bo
        /*if (user.result.rows[0].EMAIL_INSTITUCIONAL == null) {
            // console.log(user.result.rows[0].EMAIL_INSTITUCIONAL == null);
            // console.log(gsuitparams(user.result.rows[0]));
            const params = gsuitparams(user.result.rows[0]);
            const gsuitaccount = await fetch(urlgsuitiaccount, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': 'IvPhkLXSxwmUrFKOP9MLne2kX0AabdRqHO37OV0V6S1Nw6t2EGr0B3bdeUf2Gkuaq77ZlMijbxtiXP7Q/TtlzQ==',
                    'ClientCode': 'CREATE-ACCOUNT'
                },
                body: JSON.stringify(params)
            });
            if (gsuitaccount.ok) {
                const account = await gsuitaccount.json();
                const response = await fetch(`${process.env.URL}/update_user?api_key=${process.env.API_KEY}&id=${user.result.rows[0].LMS_ID}&email=${account.Response.Result.Email}`);
                const updateuserneo = await response.json();
                const userupdate = await db.query(sqlupdate, [account.Response.Result.Email, account.Response.Result.Password, user.result.rows[0].LMS_ID], true);
                console.log("updateuserneo", updateuserneo);
                console.log("userupdate", userupdate);
            }

        }*/
        //inscripcion a neo y registro en DB
        const sqlinscripcion = `DECLARE ` +
            `data NUMBER; ` +
            `BEGIN ` +
            `SELECT COUNT(*) INTO data FROM INSCRIPCION_UCB_ONLINE WHERE (LMS_ID_USUARIO = ${user.result.rows[0].LMS_ID} AND LMS_ID_MATERIA = ${user.result.rows[0].LMS_ID_MATERIA}); ` +
            `IF data = 0 THEN ` +
            `INSERT INTO INSCRIPCION_UCB_ONLINE (LMS_ID_USUARIO, LMS_ID_MATERIA) VALUES (${user.result.rows[0].LMS_ID}, ${user.result.rows[0].LMS_ID_MATERIA}); ` +
            `COMMIT; ` +
            `END IF; ` +
            `END;`;
        const inscripcion = await db.query(sqlinscripcion, [], true);
        if (inscripcion.status) {
            const response = await fetch(`${process.env.URL}/reactivate_students_in_class?api_key=${process.env.API_KEY}&class_id=${user.result.rows[0].LMS_ID_MATERIA}&user_ids=${user.result.rows[0].LMS_ID}`);
            const inscripcion_neo = await response.json();
            return res.json({
                ok: true,
                data: inscripcion,
                inscripcion_neo
            })
        } else {
            return error(res, inscripcion);
        }
    }
})

error = (res, data) => {
    return res.status(500).json({
        ok: false,
        err: {
            msg: "Error interno en el Servidor",
            error: data.err
        }
    })
}

success = (res, data) => {
    return res.json({
        ok: true,
        data
    })
}

gsuitparams = (data) => {
    const params = {
        Parametros: {
            Encrypted: "0",
            NsPersona: "51" + data.NUM_SEC,
            NsRegional: "51",
            NsPrograma: "513",
            NsPeriodo: "517421",
            ApPaterno: "" + data.AP_PATERNO,
            ApMaterno: "" + data.AP_MATERNO,
            Nombres: "" + data.NOMBRES,
            Sexo: "" + data.SEXO,
            Listas: "",
            Alias: "",
            Tipo: "5",
            EmailPersonal: "" + data.EMAIL,
            DocIdentidad: "" + data.DOC_IDENTIDAD,
            Cargo: "",
            FechaNacimiento: "",
            DepartamentoAcademico: "",
            Celular: ""
        }
    };
    return params;
}

module.exports = app;