const yup = require('yup');
//import * as yup from 'yup';

const schemaAuth = yup.object().shape({
    doc_identidad: yup.string().required()
});

const schemaUsuario = yup.object().shape({
    doc_identidad: yup.string().required(),
    ap_paterno: yup.string().required(),
    ap_materno: yup.string(),
    nombres: yup.string().required(),
    sexo: yup.string().required(),
    fecha_nacimiento: yup.string().required(),
    email: yup.string().email().required(),
    lms_id_usuario: yup.number().required(),
    lms_id_materia: yup.number().required(),
    num_sec_servicio: yup.number().required(),
});

const schemaUsuarioInstructor = yup.object().shape({
    lms_id_usuario: yup.number().required(),
    doc_identidad: yup.string().required(),
    ap_paterno: yup.string(),
    ap_materno: yup.string(),
    nombres: yup.string().required(),
    sexo: yup.string(),
    fecha_nacimiento: yup.string(),
    email_personal: yup.string()
});

const schemaInscripcion = yup.object().shape({
    lms_id_materia: yup.number().required(),
    lms_id_usuario: yup.number().required(),
    num_sec_servicio: yup.number().required()
});

const schemaMateria = yup.object().shape({
    lms_id_materia: yup.number().required(),
    nombre: yup.string().required(),
    fecha_inicio: yup.string(),
    fecha_fin: yup.string(),
    creditos: yup.number(),
    organizacion: yup.string(),
    num_sec_servicio: yup.number().required(),
    costo: yup.number().required()
});

const schemaInscripcionEstudiante = yup.object().shape({
    num_sec_servicio: yup.number().required(),
    num_sec_usuario: yup.number().required()
});

module.exports = {
    schemaAuth,
    schemaUsuario,
    schemaInscripcion,
    schemaMateria,
    schemaInscripcionEstudiante,
    schemaUsuarioInstructor
}