const jwt = require('jsonwebtoken');
const config = require('../config');
const pool = require('../db-data/bq_data');

const { secret } = config;

/** @module auth */
module.exports = (app, nextMain) => {
  /**
   * @name /auth
   * @description Crea token de autenticación.
   * @path {POST} /auth
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @response {Object} resp
   * @response {String} resp.token Token a usar para los requests sucesivos
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @auth No requiere autenticación
   */
  app.post('/auth', async (req, resp, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(400);
    }
    // TODO: autenticar a la usuarix
    try {
      const query = await pool.query('SELECT * FROM auth ', (error, result) => {
        if (error) throw error;
        const someUserDB = result.some((user) => user.email === email && user.passwordAuth === password);
        if (someUserDB === true) {
          const token = jwt.sign({ email }, secret);
          console.log(secret);
          resp.header('authorization', token);
          return resp.status(200).send({ message: 'succesful', token });
        }
        next(404);
      });
      return query;
    } catch (error) {
      return error;
    }

    // next();
  });
  return nextMain();
};
