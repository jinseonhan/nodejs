// mariadb 설정
const maria = require('mysql');
const mariaConn = maria.createConnection({
  host : 'localhost',
  port:3306,
  user:'root',
  password:'1234',
  database:'nodejs'
});
module.exports = mariaConn;