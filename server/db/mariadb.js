const mariadb = require('mariadb');

const config = {
    host: "35.197.50.99",
    user: "neo_lms",
    password: "lms-neo-2021",
    database: "neo_lms",
    connectionLimit: 5
}

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