/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
const {
  requireAuth,
} = require('../middleware/auth');
const { getData } = require('../controller/users');
const {
  getDataByKeyword, postData, updateDataByKeyword, deleteData,
} = require('../db-data/sql_functions');

const { getAllData } = require('../db-data/sql_functions');

const { dataError } = require('../utils/utils');

/** @module orders */
module.exports = (app, nextMain) => {
  /**
   * @name GET /orders
   * @description Lista órdenes
   * @path {GET} /orders
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación
   * @response {Array} orders
   * @response {String} orders[]._id Id
   * @response {String} orders[].userId Id usuaria que creó la orden
   * @response {String} orders[].client Clienta para quien se creó la orden
   * @response {Array} orders[].products Productos
   * @response {Object} orders[].products[] Producto
   * @response {Number} orders[].products[].qty Cantidad
   * @response {Object} orders[].products[].product Producto
   * @response {String} orders[].status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} orders[].dateEntry Fecha de creación
   * @response {Date} [orders[].dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   */
  app.get('/orders', requireAuth, (req, resp, next) => getData(req, resp, next, 'orders'));
  /**
   * @name GET /orders/:orderId
   * @description Obtiene los datos de una orden especifico
   * @path {GET} /orders/:orderId
   * @params {String} :orderId `id` de la orden a consultar
   * @auth Requiere `token` de autenticación
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si la orden con `orderId` indicado no existe
   */
  app.get('/orders/:orderId', requireAuth, (req, resp, next) => {
    const { orderId } = req.params;
    if (!orderId || !req.headers.authorization) {
      return dataError(!orderId, !req.headers.authorization, resp);
    }
    console.log(`hola, soy ${orderId}`);
    getDataByKeyword('orders', '_id', orderId)
      .then((result) => getDataByKeyword('orders_products', 'orderId', orderId)
        .then((products) => {
          const listOfProducts = products.map((productObj) => ({
            qty: productObj.qty,
            product: productObj.product,
          }));
          result[0]._id = orderId.toString();
          result[0].products = listOfProducts;
          return resp.status(200).send(result[0]);
        }))
      .catch(() => resp.status(404).send({ message: 'El producto solicitado no existe' }));
  });

  /**
   * @name POST /orders
   * @description Crea una nueva orden
   * @path {POST} /orders
   * @auth Requiere `token` de autenticación
   * @body {String} userId Id usuaria que creó la orden
   * @body {String} client Clienta para quien se creó la orden
   * @body {Array} products Productos
   * @body {Object} products[] Producto
   * @body {String} products[].productId Id de un producto
   * @body {Number} products[].qty Cantidad de ese producto en la orden
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {400} no se indica `userId` o se intenta crear una orden sin productos
   * @code {401} si no hay cabecera de autenticación
   */
  app.post('/orders', requireAuth, (req, resp, next) => {
    const {
      userId, client, products,
    } = req.body;
    if ((!userId || !products) || !req.headers.authorization) {
      return dataError((!userId || !products), !req.headers.authorization, resp);
    }
    const date = new Date();

    const newOrder = {
      userId: Number(userId),
      client,
      status: 'pending',
      dateEntry: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
    };
    postData('orders', newOrder)
      .then((result) => {
        products.forEach((productObj) => {
          // console.log(productObj.product);
          const newOrderProduct = {
            orderId: result.insertId,
            qty: productObj.qty,
            productId: productObj.productId,
          };
          postData('orders_products', newOrderProduct);
          const dataProduct = products.forEach((p) => {
            const productID = p.productId;
            // console.log(productID);
            return getDataByKeyword('products', '_id', productID);
          });
        });
        newOrder._id = (result.insertId).toString();
        newOrder.products = products;
        return resp.status(200).send(newOrder);
      })
      .catch((error) => console.error(error));
  });

  /**
   * @name PUT /orders
   * @description Modifica una orden
   * @path {PUT} /products
   * @params {String} :orderId `id` de la orden
   * @auth Requiere `token` de autenticación
   * @body {String} [userId] Id usuaria que creó la orden
   * @body {String} [client] Clienta para quien se creó la orden
   * @body {Array} [products] Productos
   * @body {Object} products[] Producto
   * @body {String} products[].productId Id de un producto
   * @body {Number} products[].qty Cantidad de ese producto en la orden
   * @body {String} [status] Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {400} si no se indican ninguna propiedad a modificar o la propiedad `status` no es valida
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si la orderId con `orderId` indicado no existe
   */
  app.put('/orders/:orderId', requireAuth, (req, resp, next) => {
  });

  /**
   * @name DELETE /orders
   * @description Elimina una orden
   * @path {DELETE} /orders
   * @params {String} :orderId `id` del producto
   * @auth Requiere `token` de autenticación
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si el producto con `orderId` indicado no existe
   */
  app.delete('/orders/:orderId', requireAuth, (req, resp, next) => {
    const { orderId } = req.params;
    if (!orderId || !req.headers.authorization) {
      return dataError(!orderId, !req.headers.authorization, resp);
    }
    getDataByKeyword('orders', '_id', orderId)
      .then((order) => {
        deleteData('orders', '_id', orderId);
        order[0]._id = orderId.toString();
        return resp.status(200).send(order[0]);
      })
      .catch(() => resp.status(404).send({ message: `No existe el producto con id ${orderId}.` }));
  });

  nextMain();
};
