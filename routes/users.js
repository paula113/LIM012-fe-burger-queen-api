/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const bcrypt = require('bcrypt');
const pool = require('../db-data/bq_data');

const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');

const { getData } = require('../controller/users');//

const {
  getDataByKeyword, postData, updateDataByKeyword, deleteData,
} = require('../db-data/sql_functions');

const { dataError, validate, valPassword } = require('../utils/utils');

const initAdminUser = (app, next) => {
  const { adminEmail, adminPassword } = app.get('config');
  if (!adminEmail || !adminPassword) {
    return next();// 400 ✓
  }

  const adminUser = {
    id: Number('1010101'),
    email: adminEmail,
    userpassword: bcrypt.hashSync(adminPassword, 10),
    rolesAdmin: true,
  };
  // TODO: crear usuaria admin
  pool.query('SELECT * from users', (error, result) => {
    if (result.length === 0) {
      pool.query('INSERT INTO users SET ?', adminUser, (error, result) => {
        if (error) throw error;
      });
    }
  });
  next();
};

/*
 * Diagrama de flujo de una aplicación y petición en node - express :
 *
 * request  -> middleware1 -> middleware2 -> route
 *                                             |
 * response <- middleware4 <- middleware3   <---
 *
 * la gracia es que la petición va pasando por cada una de las funciones
 * intermedias o "middlewares" hasta llegar a la función de la ruta, luego esa
 * función genera la respuesta y esta pasa nuevamente por otras funciones
 * intermedias hasta responder finalmente a la usuaria.
 *
 * Un ejemplo de middleware podría ser una función que verifique que una usuaria
 * está realmente registrado en la aplicación y que tiene permisos para usar la
 * ruta. O también un middleware de traducción, que cambie la respuesta
 * dependiendo del idioma de la usuaria.
 *
 * Es por lo anterior que siempre veremos los argumentos request, response y
 * next en nuestros middlewares y rutas. Cada una de estas funciones tendrá
 * la oportunidad de acceder a la consulta (request) y hacerse cargo de enviar
 * una respuesta (rompiendo la cadena), o delegar la consulta a la siguiente
 * función en la cadena (invocando next). De esta forma, la petición (request)
 * va pasando a través de las funciones, así como también la respuesta
 * (response).
 */

/** @module users */
module.exports = (app, next) => {
  /**
   * @name GET /users
   * @description Lista usuarias
   * @path {GET} /users
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @response {Array} users
   * @response {String} users[]._id
   * @response {Object} users[].email
   * @response {Object} users[].roles
   * @response {Boolean} users[].roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin
   */
  app.get('/users', requireAdmin, (req, resp, next) => getData(req, resp, next, 'users'));

  /**
   * @name GET /users/:uid
   * @description Obtiene información de una usuaria
   * @path {GET} /users/:uid
   * @params {String} :uid `id` o `email` de la usuaria a consultar
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a consultar
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {404} si la usuaria solicitada no existe
   */
  app.get('/users/:str', requireAdmin, (_req, _resp) => {
    const { str } = _req.params;

    dataError(!str, !_req.headers.authorization, _resp);

    const keyword = (str.includes('@')) ? 'email' : 'id';
    getDataByKeyword('users', keyword, str)
      .then((result) => {
        console.log(result);
        const admin = !!(result[0].rolesAdmin);
        return _resp.status(200).send(
          {
            _id: result[0].id,
            email: result[0].email,
            roles: { admin },
          },
        );
      })
      .catch(() => _resp.status(404).send({ message: 'User does not exist' }));
  });

  /**
   * @name POST /users
   * @description Crea una usuaria
   * @path {POST} /users
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @body {Object} [roles]
   * @body {Boolean} [roles.admin]
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si ya existe usuaria con ese `email`
   */
  app.post('/users', requireAdmin, (_req, resp, _next) => {
    // Para verificar valores
    const { email, password, roles } = _req.body;

    // eslint-disable-next-line no-console
    const validateEmail = validate(email);
    const validatePassword = valPassword(password);
    const isThereHeaders = !_req.headers.authorization;
    const message = { mensaje: 'Missing email or password' };
    const areInvalid = (validateEmail || validatePassword);
    const sendError = dataError(areInvalid, !_req.headers.authorization, message, resp);

    const validateDatabeforeDB = areInvalid ? sendError : checkDB;

    if (!!(validateEmail) && !condition1) {
      const role = roles ? roles.admin : false;
      console.log(`password ${password}`);
      const newUserdetails = {
        email,
        userpassword: bcrypt.hashSync(password, 10),
        rolesAdmin: role,
      };
      getDataByKeyword('users', 'email', email)
        .then(() => resp.status(403).send({ message: `Ya existe usuaria con el email : ${email}` }))
        .catch(() => {
          postData('users', newUserdetails)
            .then((result) => resp.status(200).send(
              {
                _id: result.insertId,
                user: newUserdetails.email,
                roles: { admin: newUserdetails.rolesAdmin },
              },
            ));
        });
    } else { // ! because email or passwor are invalid
      return dataError(!condition1, condition2, message, resp);
    }
  });
  /**
   * @name PUT /users
   * @description Modifica una usuaria
   * @params {String} :uid `id` o `email` de la usuaria a modificar
   * @path {PUT} /users
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @body {Object} [roles]
   * @body {Boolean} [roles.admin]
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a modificar
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {403} una usuaria no admin intenta de modificar sus `roles`
   * @code {404} si la usuaria solicitada no existe
   */
  app.put('/users/:uid', requireAdmin && requireAuth, (_req, _resp, _next) => {
    const { uid } = _req.params;
    const { email, password, roles } = _req.body;
    dataError(!email || !uid, !_req.headers.authorization, _resp);
    if (!(_req.user.id === Number(uid) || _req.user.rolesAdmin)) {
      return _resp.status(403).send({ message: 'You do not have enough permissions' });
    }
    const updateDetails = {
      email,
      userpassword: bcrypt.hashSync(password, 10),
      rolesAdmin: roles.admin,
    };

    getDataByKeyword('users', 'id', uid)
      .then(() => {
        updateDataByKeyword('users', updateDetails, 'id', uid);
        return _resp.status(200).send(
          {
            _id: uid,
            user: updateDetails.email,
            roles: { admin: updateDetails.rolesAdmin },
          },
        );
      })
      .catch(() => _resp.status(404).send({ message: `El usuario con id ${uid} no existe.` }));
  });

  /**
   * @name DELETE /users
   * @description Elimina una usuaria
   * @params {String} :uid `id` o `email` de la usuaria a modificar
   * @path {DELETE} /users
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a eliminar
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {404} si la usuaria solicitada no existe
   */
  app.delete('/users/:uid', requireAdmin, async (_req, _resp, _next) => {
    const { uid } = _req.params;
    // const { email } = _req.body;
    // dataError(!email || !uid, !_req.headers.authorization, _resp);
    const userDeleted = {
      _id: uid,
    };

    getDataByKeyword('users', 'id', uid)
      .then((user) => {
        const admin = !!(user[0].rolesAdmin);
        userDeleted.user = user[0].email;
        userDeleted.roles = { admin };
        deleteData('users', 'id', uid);
        _resp.status(200).send(userDeleted);
      })
      .catch(() => _resp.status(403).send({ message: `No existe el usuario con id ${uid}` }));
  });
  initAdminUser(app, next);
};
