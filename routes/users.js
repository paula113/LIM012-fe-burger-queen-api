/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const bcrypt = require('bcrypt');

const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');

const { getData } = require('../controller/users');

const {
  getDataByKeyword, postData, updateDataByKeyword, deleteData, getAllData,
} = require('../db-data/sql_functions');

const { dataError } = require('../utils/utils');

const {
  validate,
  valPassword,
} = require('../utils/validators');

const initAdminUser = (app, next) => {
  const { adminEmail, adminPassword } = app.get('config');
  if (!adminEmail || !adminPassword) {
    return next();// 400 ✓
  }

  const adminUser = {
    _id: Number('1010101'),
    email: adminEmail,
    password: bcrypt.hashSync(adminPassword, 10),
    rolesAdmin: true,
  };
  // TODO: crear usuaria admin
  getAllData('users')
    .then(() => next())
    .catch(() => {
      console.log('no user');
      postData('users', adminUser);
      return next();
    });
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
  app.get('/users/:str', requireAdmin && requireAuth, (_req, _resp) => {
    const { str } = _req.params;
    if (!str || !_req.headers.authorization) {
      return dataError(!str, !_req.headers.authorization, _resp);
    }
    const keyword = (str.includes('@')) ? 'email' : '_id';
    if (!((_req.user[keyword]).toString() === str || _req.user.rolesAdmin)) {
      return _resp.status(403).send({ message: 'You do not have enough permissions' });
    }

    getDataByKeyword('users', keyword, str)
      .then((result) => {
        const admin = !!(result[0].rolesAdmin);
        return _resp.status(200).send(
          {
            _id: (result[0]._id).toString(),
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

    const validateInput = validate(email) && valPassword(password);
    if (!(email && password) || !_req.headers.authorization) {
      return dataError(!(email && password), !_req.headers.authorization, resp);
    } if (!validateInput) {
      return resp.status(400).send({ mensaje: 'Invalid email or password' });
    }

    const role = roles ? roles.admin : false;
    const newUserdetails = {
      email,
      password: bcrypt.hashSync(password, 10),
      rolesAdmin: role,
    };
    // Para saber si usuario existe en la base de datos
    getDataByKeyword('users', 'email', email)
      .then(() => resp.status(403).send({ message: `Ya existe usuaria con el email : ${email}` }))
      .catch(() => {
        postData('users', newUserdetails)
          .then((result) => resp.status(200).send(
            {
              _id: (result.insertId).toString(),
              email: newUserdetails.email,
              roles: { admin: newUserdetails.rolesAdmin },
            },
          ));
      });
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
  app.put('/users/:str', requireAdmin && requireAuth, (_req, _resp, _next) => {
    const { str } = _req.params;
    const { email, password, roles } = _req.body;

    const keyword = (str.includes('@')) ? 'email' : '_id';
    const canEdit = (str.includes('@')) ? (_req.user.email === str) : (_req.user._id === Number(str));
    const isAdmin = _req.user.rolesAdmin === 1;
    const cantEditRole = (!!roles && !isAdmin); // false

    if (!(canEdit || isAdmin) || cantEditRole) {
      return _resp.status(403).send({ message: 'You do not have enough permissions' });
    }

    const validateEmail = validate(email);
    const validatePassword = valPassword(password);
    const role = roles ? roles.admin : false;

    const updatedDetails = {
      ...((email && validateEmail) && { email, rolesAdmin: role }),
      // eslint-disable-next-line max-len
      ...((password && validatePassword) && { password: bcrypt.hashSync(password, 10), rolesAdmin: role }),
    };

    getDataByKeyword('users', keyword, str)
      .then((user) => {
        if (!str || !(email || password || roles)) {
          // eslint-disable-next-line max-len
          return dataError(!str || !(email || password || roles), !_req.headers.authorization, _resp);
        }
        const userID = (user[0]._id).toString();
        updateDataByKeyword('users', updatedDetails, keyword, str)
          .then(() => getDataByKeyword('users', keyword, (email || password || roles))
            .then((user) => _resp.status(200).send(
              {
                _id: user[0]._id,
                email: user[0].email,
                roles: { admin: !!user[0].rolesAdmin },
              },
            )));
      })
      .catch(() => _resp.status(404).send({ message: `El usuario con id ${str} no existe.` }));
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
  app.delete('/users/:str', requireAdmin && requireAuth, (_req, _resp, _next) => {
    const { str } = _req.params;
    if (!str || !_req.headers.authorization) {
      return dataError(!str, !_req.headers.authorization, _resp);
    }

    const keyword = (str.includes('@')) ? 'email' : '_id';
    if (!((_req.user[keyword]).toString() === str || _req.user.rolesAdmin)) {
      return _resp.status(403).send({ message: 'You do not have enough permissions' });
    }
    const userDeleted = {
      _id: str,
    };

    getDataByKeyword('users', keyword, str)
      .then((user) => {
        const admin = !!(user[0].rolesAdmin);
        userDeleted.email = user[0].email;
        userDeleted.roles = { admin };
        deleteData('users', keyword, str);
        _resp.status(200).send(userDeleted);
      })
      .catch(() => _resp.status(404).send({ message: `No existe el usuario con id ${str}` }));
  });
  initAdminUser(app, next);
};
