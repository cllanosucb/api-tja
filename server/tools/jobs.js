const moment = require('moment');
const { array } = require('yup');
const fetch = (...args) =>
    import ('node-fetch').then(({ default: fetch }) => fetch(...args));
//conexion a mariaDb
const mariaDb = require('../db/mariadb');
require('dotenv').config();

const job_inscripcion = async() => {
    console.log("Inicio Job");
    const fecha = moment().format('YYYY-MM-DD');

    const listaPagos = await getVerPagoFecha('2021-11-24', fecha);
    // console.log("listaPagos", listaPagos);
    const lista = await listaSinDuplicadosSinEmail(listaPagos);
    console.log("lista", lista);
    const cont = await registroUsuario(lista);
    console.log("cont", cont);
    /* lista.forEach(async item => {
        // console.log("item", item);
        // const insertUsuario = await registrarUsuario(item.LMS_ID_USUARIO, item.CEDULA_IDENTIDAD, item.AP_PATERNO, item.AP_MATERNO, item.NOMBRES, item.GENERO, item.FECHA_NAC, item.EMAIL, 'institucional', 'pass');
        // console.log("insertUsuario", insertUsuario);
        const respCorreo = await generarCorreoInstitucionalInscritos("8" + item.LMS_ID_USUARIO, "71" + item.CEDULA_IDENTIDAD, item.AP_PATERNO, item.AP_MATERNO, item.NOMBRES, item.GENERO, item.FECHA_NAC, item.EMAIL);
        if (respCorreo.ok) {
            console.log(respCorreo);
            const updateUsuarioNeo = await actualizarEmailNeo(respCorreo.datos.Response.Result.Email, item.LMS_ID_USUARIO);
            const insertInstructor = await registrarInstructor(item.LMS_ID_USUARIO, item.CEDULA_IDENTIDAD, item.AP_PATERNO, item.AP_MATERNO, item.NOMBRES, item.GENERO, item.FECHA_NAC, item.EMAIL, respCorreo.datos.Response.Result.Email, respCorreo.datos.Response.Result.Password);
            console.log("updateUsuarioNeo", updateUsuarioNeo);
            console.log("insertInstructor", insertInstructor);
        } else {
            console.log("respCorreo", respCorreo.error.error);
        }
    }); */
    console.log("Fin Job");
}

getVerPagoFecha = async(fecha_inicio, fecha_fin) => {
    try {
        const respPeticion = await fetch(`${process.env.URL_GETVERPAGOSFECHA}/${fecha_inicio}/${fecha_fin}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Token': process.env.TOKEN_GETVERPAGOSFECHA,
            },
        });
        if (respPeticion.ok) {
            const lista = await respPeticion.json();
            return lista;
        } else {
            return []
        }
    } catch (err) {
        return []
    }
}

listaSinDuplicadosSinEmail = async(listaPagos) => {
    var hash = {};
    let lista = [];
    const arrayList = listaPagos.filter(function(current) {
        var exists = !hash[current.LMS_ID_USUARIO];
        hash[current.LMS_ID_USUARIO] = true;
        return exists;
    });
    arrayList.forEach(item => {
        if (item.EMAIL.split('@')[1] != 'online.ucb.edu.bo') { //online.ucb.edu.bo
            lista.push(item);
        }
    });
    return lista
}

generarCorreoInstitucionalInscritos = async(lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal) => {
    const params = emailParamsUsuario(lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal);
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
        if (gsuitaccount.ok) {
            return {
                ok: true,
                datos
            };
        } else {
            return {
                ok: false,
                error: {
                    error: datos
                }
            };
        }
        // console.log("datos", datos);
    } catch (err) {
        return {
            ok: false,
            error: {
                error: err
            }
        };
    }
}

actualizarEmailNeoUsuario = async(email_institucional, lms_id_usuario) => {
    try {
        const response = await fetch(`${process.env.URL}/update_user?api_key=${process.env.API_KEY}&id=${lms_id_usuario}&email=${email_institucional}`);
        const updateuserneo = await response.json();
        return {
            ok: true,
            datos: updateuserneo
        };
    } catch (err) {
        return {
            ok: false,
            error: {
                error: err
            }
        };
    }
}

registrarUsuario = async(lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal, email_institucional, password) => {
    let conn;
    const querySelect = "select * from usuarios where (lms_id_usuario = ?)";
    const queryInsert = "INSERT INTO usuarios (lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal, email_institucional, password) VALUES (?,?,?,?,?,?,?,?,?,?);";
    let resp = {};
    let rowsInsert = null;
    try {
        conn = await mariaDb.mariaDbConnection();
        const rowsSelect = await conn.query(querySelect, [lms_id_usuario]);
        if (rowsSelect.length == 0) {
            const rows = await conn.query(queryInsert, [lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo == 1 ? 'Hombre' : 'Mujer', fecha_nacimiento, email_personal, email_institucional, password]);
            rowsInsert = rows;
        }
        resp = {
            ok: true,
            datos: rowsInsert
        };
        return resp;
    } catch (err) {
        resp = {
            ok: false,
            error: {
                error: err
            }
        };
    } finally {
        if (conn) {
            conn.release();
            return resp
        }
    }
}

emailParamsUsuario = (lms_id_usuario, doc_identidad, ap_paterno, ap_materno, nombres, sexo, fecha_nacimiento, email_personal) => {
    const date = moment(fecha_nacimiento).format('DD/MM/YYYY');
    // console.log(moment(date.toISOString()).format('L'));
    const params = {
        Parametros: {
            Encrypted: "0",
            NsPersona: "81" + lms_id_usuario,
            NsRegional: "81",
            NsPrograma: "81000",
            NsPeriodo: "81",
            ApPaterno: "" + ap_paterno.toUpperCase(),
            ApMaterno: "" + ap_materno != undefined ? ap_materno.toUpperCase() : "",
            Nombres: "" + nombres.toUpperCase(),
            Sexo: "" + sexo,
            Listas: "",
            Alias: "",
            Tipo: "5",
            EmailPersonal: "" + email_personal != '-' ? email_personal : `${nombres.toLowerCase()}@gmail.com`,
            DocIdentidad: "" + doc_identidad,
            Cargo: "",
            FechaNacimiento: `${fecha_nacimiento != undefined ? moment(fecha_nacimiento).format('DD/MM/YYYY') : '' }`,
            DepartamentoAcademico: "",
            Celular: ""
        }
    };
    return params;
}

registroUsuario = (lista) => {
    let cont = 0;
    lista.forEach(async item => {
        // console.log("item", item);
        // const insertUsuario = await registrarUsuario(item.LMS_ID_USUARIO, item.CEDULA_IDENTIDAD, item.AP_PATERNO, item.AP_MATERNO, item.NOMBRES, item.GENERO, item.FECHA_NAC, item.EMAIL, 'institucional', 'pass');
        // console.log("insertUsuario", insertUsuario);
        const respCorreo = await generarCorreoInstitucionalInscritos(item.LMS_ID_USUARIO, item.CEDULA_IDENTIDAD, item.AP_PATERNO, item.AP_MATERNO, item.NOMBRES, item.GENERO, item.FECHA_NAC, item.EMAIL);
        if (respCorreo.ok) {
            console.log(respCorreo);
            console.log(respCorreo.datos.Response.Result.Email, respCorreo.datos.Response.Result.Password);
            const updateUsuarioNeo = await actualizarEmailNeoUsuario(respCorreo.datos.Response.Result.Email, item.LMS_ID_USUARIO);
            const insertUsuario = await registrarUsuario(item.LMS_ID_USUARIO, item.CEDULA_IDENTIDAD, item.AP_PATERNO, item.AP_MATERNO, item.NOMBRES, item.GENERO, item.FECHA_NAC, item.EMAIL, respCorreo.datos.Response.Result.Email, respCorreo.datos.Response.Result.Password);
            cont++;
            console.log("updateUsuarioNeo", updateUsuarioNeo);
            console.log("insertUsuario", insertUsuario);
        } else {
            console.log("respCorreo", respCorreo.error.error);
        }
    });
    return cont;
}

module.exports = {
    job_inscripcion
}