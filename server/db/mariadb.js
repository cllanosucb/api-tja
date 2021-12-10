const mariadb = require('mariadb');
require('dotenv').config();

const config = {
        host: process.env.MARIADB_HOST,
        user: process.env.MARIADB_USER,
        password: process.env.MARIADB_PASS,
        database: process.env.MARIADB_DATABASE,
        connectionLimit: 5
    }
    /* const config = {
        host: "35.197.50.99",
        user: "neo_lms",
        password: "lms-neo-2021",
        database: "neo_lms",
        connectionLimit: 5
    } */

const pool = mariadb.createPool(config);

mariaDbConnection = function() {
    return new Promise(function(resolve, reject) {
        pool.getConnection().then(function(connection) {
            resolve(connection);
        }).catch(function(error) {
            reject(error);
        });
    });
}

module.exports = {
    mariaDbConnection
};