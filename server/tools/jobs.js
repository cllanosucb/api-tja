const fetch = (...args) =>
    import ('node-fetch').then(({ default: fetch }) => fetch(...args));
const db = require('../db/connection_db');
require('dotenv').config();

const job_inscripcion = async() => {
    console.log("Inicio Job");
    const lista = await listaincripciones();
    // console.log(lista);
    await verificarpago(lista);
    console.log("Fin Job");
}

const listaincripciones = async() => {
    const sql = `SELECT *
    FROM WEB.INSCRIPCION_UCB_ONLINE i, WEB.USUARIOS_UCB_ONLINE u
    WHERE (i.LMS_ID_USUARIO = u.LMS_ID_USUARIO AND i.ESTADO_PAGO = 0)`;
    const resp = await db.query(sql, [], true);
    console.log("resp1", resp);
    return resp.status ? resp.result.rows : [];
}

const verificarpago = (lista) => {
    // const sqlpago = "SELECT * FROM PAGOS WHERE(NUM_SEC_USUARIO = :NUM_SEC_USUARIO AND NUM_SEC_SERVICIO = :NUM_SEC_SERVICIO)";
    const sqlpago = "SELECT * FROM CAJA_DETALLES WHERE (NUM_SEC_ANALITICO = :NUM_SEC_USUARIO AND NUM_SEC_SERVICIO = :NUM_SEC_SERVICIO);";
    const sqlupdate = "UPDATE WEB.USUARIOS_UCB_ONLINE SET EMAIL_INSTITUCIONAL = :EMAIL_INSTITUCIONAL, PASSWORD_INSTITUCIONAL = :PASSWORD WHERE LMS_ID_USUARIO = :LMS_ID_USUARIO";
    const sqlupdateinscripcion = "UPDATE WEB.INSCRIPCION_UCB_ONLINE SET ESTADO_PAGO = :ESTADO WHERE LMS_ID_USUARIO = :LMS_ID_USUARIO AND LMS_ID_MATERIA = :LMS_ID_MATERIA";
    lista.forEach(async user => {
        const resp = await db.query(sqlpago, /* [1111, 111] */ [user.NUM_SEC_PERSONA, user.NUM_SEC_SERVICIO], true);
        const data = resp.status ? resp.result.rows.length > 0 ? resp.result.rows[0] : null : null;
        console.log("data", data);
        console.log("resp", resp);
        if (data != null) {

            /*if (data.EMAIL_INSTITUCIONAL == null) {
                const params = gsuitparams(user);
                const gsuitaccount = await fetch(process.env.URL_BACKEND_UCB, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Token': process.env.TOKEN_BACKEND_UCB,
                        'ClientCode': 'CREATE-ACCOUNT'
                    },
                    body: JSON.stringify(params)
                });
                if (gsuitaccount.ok) {
                    const account = await gsuitaccount.json();
                    const response = await fetch(`${process.env.URL}/update_user?api_key=${process.env.API_KEY}&id=${user.LMS_ID_USUARIO}&email=${account.Response.Result.Email}`);
                    const updateuserneo = await response.json();
                    const userupdate = await db.query(sqlupdate, [account.Response.Result.Email, account.Response.Result.Password, user.LMS_ID_USUARIO], true);
                    console.log("updateuserneo", updateuserneo);
                    console.log("userupdate", userupdate);
                }

            }*/

            const response = await fetch(`${process.env.URL}/reactivate_students_in_class?api_key=${process.env.API_KEY}&class_id=${user.LMS_ID_MATERIA}&user_ids=${user.LMS_ID_USUARIO}`);
            const inscripcion_neo = await response.json();
            const inscripcionupdate = await db.query(sqlupdateinscripcion, [1, user.LMS_ID_USUARIO, user.LMS_ID_MATERIA], true);
            console.log("inscripcion_neo", inscripcion_neo);
            console.log("inscripcionupdate", inscripcionupdate);
        }
    });
}

gsuitparams = (data) => {
    const params = {
        Parametros: {
            Encrypted: "0",
            NsPersona: "81" + data.NUM_SEC_PERSONA,
            NsRegional: "81",
            NsPrograma: "81000",
            NsPeriodo: null,
            ApPaterno: "" + data.AP_PATERNO,
            ApMaterno: "" + data.AP_MATERNO,
            Nombres: "" + data.NOMBRES,
            Sexo: "" + data.SEXO,
            Listas: "",
            Alias: "",
            Tipo: "5",
            EmailPersonal: "" + data.EMAIL,
            DocIdentidad: "" + data.CEDULA_IDENTIDAD,
            Cargo: "",
            FechaNacimiento: "",
            DepartamentoAcademico: "",
            Celular: ""
        }
    };
    return params;
}

module.exports = {
    job_inscripcion
}