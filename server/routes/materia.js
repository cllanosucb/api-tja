const express = require('express');
const db = require('../db/connection_db');
require('dotenv').config();

const {
    validSchemaMateria
} = require('../middleware/middleware')

const app = express();

app.post('/registro', validSchemaMateria, async(req, res) => {
    const { lms_id, nombre, fecha_inicio, fecha_fin, creditos, organizacion, num_sec_servicio, costo } = req.body;
    const sqlmateria = `DECLARE
        data NUMBER;
        BEGIN
        SELECT COUNT(*) INTO data FROM MATERIAS_UCB_ONLINE WHERE LMS_ID = ${lms_id};
        IF data = 0 THEN
        INSERT INTO MATERIAS_UCB_ONLINE (LMS_ID, NOMBRE, FECHA_INICIO, FECHA_FIN, CREDITOS, ORGANIZACION, NUM_SEC_SERVICIO, COSTO) VALUES (${lms_id}, '${nombre.toUpperCase()}', TO_DATE('${fecha_inicio}', 'YYYY-MM-DD'), TO_DATE('${fecha_fin}', 'YYYY-MM-DD'), ${creditos}, '${organizacion.toUpperCase()}', ${num_sec_servicio}, ${costo});
        COMMIT;
        END IF;
        END;`;
    const insertmateria = await db.query(sqlmateria, [], true);
    if (insertmateria.status) {
        return success(res, insertmateria);
    } else {
        return error(res, insertmateria);
    }
});

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