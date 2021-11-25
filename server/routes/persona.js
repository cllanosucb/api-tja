const express = require('express');
const jwt = require('jsonwebtoken');
const fetch = (...args) =>
    import ('node-fetch').then(({ default: fetch }) => fetch(...args));
const db = require('../db/connection_db');
require('dotenv').config();

const {
    validSchemaUsuario,
} = require('../middleware/middleware')

const app = express();

app.get('/prueba', async(req, res) => {
    res.json({
        msg: "Ruta /api/persona/prueba"
    })
})

app.get('/', async(req, res) => {

    sql = 'SELECT * FROM personas WHERE doc_identidad = :id';
    // db.getEmployee(7209948);
    const binds = [7209948];
    //db.open(sql, [id], false, res);
    const result = await db.query(sql, binds, false);
    console.log(result.result);
    res.json(result.result)
})

app.post('/registro/inscripcion/ucbonline', validSchemaUsuario, async(req, res) => {
    const { doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email, lms_id_usuario, lms_id_materia, num_sec_servicio } = req.body;
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
    let LMS_ID_USUARIO = lms_id_usuario;
    const sqlsecuenciador = 'SELECT MAX(NUM_SEC_PERSONA) as NUM_SEC_PERSONA FROM WEB.USUARIOS_UCB_ONLINE'
    const sqlexiste = 'SELECT * FROM PERSONAS WHERE CEDULA_IDENTIDAD LIKE :doc_identidad';
    const sec_resp = await db.query(sqlsecuenciador, [], true);
    if (sec_resp.status) {
        console.log(sec_resp.result.rows);
        const sec_nextval = sec_resp.result.rows.length > 0 ? sec_resp.result.rows[0].NUM_SEC_PERSONA + 10 : 10000004
        console.log("sec_nextval", sec_nextval);

        const existe = await db.query(sqlexiste, [CEDULA_IDENTIDAD], true);
        if (!existe.status) {
            return error(res, existe);
        } else {
            const sqlinsertuser = `DECLARE
                x_num_sec NUMBER;
                BEGIN
                INSERT INTO PERSONAS(NUM_SEC, TIPO, DOC_IDENTIDAD, TIPO_DOC, AP_PATERNO, AP_MATERNO, NOMBRES, SEXO, FECHA_NACIMIENTO, CEDULA_IDENTIDAD)VALUES (${sec_nextval}, ${TIPO}, ${DOC_IDENTIDAD}, ${TIPO_DOC}, '${AP_PATERNO}', '${AP_MATERNO}', '${NOMBRES}', ${SEXO}, to_date('${FECHA_NACIMIENTO}', 'YYYY-MM-DD'), '${CEDULA_IDENTIDAD}');
                SELECT NUM_SEC INTO x_num_sec
                FROM PERSONAS
                WHERE CEDULA_IDENTIDAD LIKE '${CEDULA_IDENTIDAD}';
                INSERT INTO WEB.USUARIOS_UCB_ONLINE (NUM_SEC_PERSONA, DOC_IDENTIDAD, AP_PATERNO, AP_MATERNO, NOMBRES, SEXO, FECHA_NACIMIENTO, CEDULA_IDENTIDAD, EMAIL, LMS_ID_USUARIO)VALUES (x_num_sec, ${DOC_IDENTIDAD}, '${AP_PATERNO}', '${AP_MATERNO}', '${NOMBRES}', ${SEXO}, to_date('${FECHA_NACIMIENTO}', 'YYYY-MM-DD'), '${CEDULA_IDENTIDAD}', '${EMAIL}', ${LMS_ID_USUARIO});
                INSERT INTO WEB.INSCRIPCION_UCB_ONLINE (LMS_ID_USUARIO, LMS_ID_MATERIA, NUM_SEC_SERVICIO, ESTADO_PAGO) VALUES (${lms_id_usuario}, ${lms_id_materia}, ${num_sec_servicio}, 0);
                COMMIT;
                END;`;
            const sqlinsertucbonline = `DECLARE
            data NUMBER;
            x_num_sec NUMBER;
            data_ins NUMBER;
            BEGIN
            SELECT COUNT(*) INTO data
            FROM WEB.USUARIOS_UCB_ONLINE
            WHERE CEDULA_IDENTIDAD LIKE '${CEDULA_IDENTIDAD}';
            IF data = 0 THEN
                SELECT NUM_SEC INTO x_num_sec
                FROM PERSONAS
                WHERE CEDULA_IDENTIDAD LIKE '${CEDULA_IDENTIDAD}';
                INSERT INTO WEB.USUARIOS_UCB_ONLINE (NUM_SEC_PERSONA, DOC_IDENTIDAD, AP_PATERNO, AP_MATERNO, NOMBRES, SEXO, FECHA_NACIMIENTO, CEDULA_IDENTIDAD, EMAIL, LMS_ID_USUARIO)VALUES (x_num_sec, ${DOC_IDENTIDAD}, '${AP_PATERNO}', '${AP_MATERNO}', '${NOMBRES}', ${SEXO}, to_date('${FECHA_NACIMIENTO}', 'YYYY-MM-DD'), '${CEDULA_IDENTIDAD}', '${EMAIL}', ${LMS_ID_USUARIO});
                INSERT INTO WEB.INSCRIPCION_UCB_ONLINE (LMS_ID_USUARIO, LMS_ID_MATERIA, NUM_SEC_SERVICIO, ESTADO_PAGO) VALUES (${lms_id_usuario}, ${lms_id_materia}, ${num_sec_servicio}, 0);
            ELSE
                SELECT COUNT(*) INTO data_ins
                FROM WEB.INSCRIPCION_UCB_ONLINE
                WHERE (LMS_ID_USUARIO = ${lms_id_usuario} AND LMS_ID_MATERIA = ${lms_id_materia});
                IF data_ins = 0 THEN
                    INSERT INTO WEB.INSCRIPCION_UCB_ONLINE (LMS_ID_USUARIO, LMS_ID_MATERIA, NUM_SEC_SERVICIO, ESTADO_PAGO) VALUES (${lms_id_usuario}, ${lms_id_materia}, ${num_sec_servicio}, 0);
                END IF;
            END IF;
            COMMIT;
            END;`;
            /*const sqlinsertucbonline = `DECLARE
                data NUMBER;
                x_num_sec NUMBER;
                BEGIN
                SELECT COUNT(*) INTO data
                FROM WEB.USUARIOS_UCB_ONLINE
                WHERE CEDULA_IDENTIDAD LIKE '${CEDULA_IDENTIDAD}';
                IF data = 0 THEN
                SELECT NUM_SEC INTO x_num_sec
                FROM PERSONAS
                WHERE CEDULA_IDENTIDAD LIKE '${CEDULA_IDENTIDAD}';
                INSERT INTO WEB.USUARIOS_UCB_ONLINE (NUM_SEC_PERSONA, DOC_IDENTIDAD, AP_PATERNO, AP_MATERNO, NOMBRES, SEXO, FECHA_NACIMIENTO, CEDULA_IDENTIDAD, EMAIL, LMS_ID_USUARIO)VALUES (x_num_sec, ${DOC_IDENTIDAD}, '${AP_PATERNO}', '${AP_MATERNO}', '${NOMBRES}', ${SEXO}, to_date('${FECHA_NACIMIENTO}', 'YYYY-MM-DD'), '${CEDULA_IDENTIDAD}', '${EMAIL}', ${LMS_ID_USUARIO});
                INSERT INTO WEB.INSCRIPCION_UCB_ONLINE (LMS_ID_USUARIO, LMS_ID_MATERIA, NUM_SEC_SERVICIO, ESTADO_PAGO) VALUES (${lms_id_usuario}, ${lms_id_materia}, ${num_sec_servicio}, 0);
                COMMIT;
                END IF;
                END;`;*/
            if (existe.result.rows.length > 0) {
                const insertuserucb = await db.query(sqlinsertucbonline, [], true);
                console.log("insertuserucb ", insertuserucb);
                await updateUserNeo(CEDULA_IDENTIDAD, lms_id_usuario);
                if (insertuserucb.status) {
                    return success(res, insertuserucb);
                } else {
                    return error(res, insertuserucb);
                }
            }
            const insertPersonas = await db.query(sqlinsertuser, [], true);
            console.log("insertPersonas ", insertPersonas);
            await updateUserNeo(CEDULA_IDENTIDAD, lms_id_usuario);
            if (!insertPersonas.status) {
                return error(res, insertPersonas);
            } else {
                return success(res, insertPersonas);
            }
        }

    } else {
        return error(res, sec_resp);
    }

})

const updateUserNeo = async(cedula_identidad, lms_id_usuario) => {
    // acutualizar datos de usuario con el mun_sec_persona
    const sqluser = "SELECT NUM_SEC_PERSONA FROM WEB.USUARIOS_UCB_ONLINE WHERE CEDULA_IDENTIDAD LIKE :CEDULA_IDENTIDAD";
    const dataUser = await db.query(sqluser, [cedula_identidad], true);
    num_sec_persona = dataUser.status ? dataUser.result.rows[0].NUM_SEC_PERSONA : ''
    const response = await fetch(`${process.env.URL}/update_user?api_key=${process.env.API_KEY}&id=${lms_id_usuario}&num_sec_persona=${num_sec_persona}`);
    const updateuserneo = await response.json();
    console.log("updateuserneo", updateuserneo);
}

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

module.exports = app;