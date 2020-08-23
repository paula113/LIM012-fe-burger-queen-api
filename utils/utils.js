/* eslint-disable no-param-reassign */
const { getDataByKeyword } = require('../db-data/sql_functions');

const pagination = (pagesNumber, limitsNumber, result, table, host) => {
  const pages = (!pagesNumber) ? 1 : pagesNumber;
  const limits = (!limitsNumber) ? result.length : limitsNumber;
  const startIndex = (pages - 1) * limits;
  const endIndex = pages * limits;
  const usersQueryLimits = result.slice(startIndex, endIndex);
  const totalPages = Math.ceil(result.length / limits);
  const previousPage = pages - 1;
  const nextPage = pages + 1;
  let link = `<https://${host}/${table}?page=1&limit=${limits}>; rel="first",<https://${host}/${table}?page=${totalPages}&limit=${limits}>; rel="last"`;
  const results = {
    link,
  };

  if (pages > 0 && pages < (totalPages + 1)) {
    const prev = `,<https://${host}/${table}?page=${previousPage}&limit=${limits}>; rel="prev",`;
    const next = `<https://${host}/${table}?page=${nextPage}&limit=${limits}>; rel="next"`;
    link = link.concat(prev, next);
    results.link = link;
    results.list = usersQueryLimits;
  }
  return results;
};

const dataError = (condicion, headers, _resp) => {
  if (condicion) {
    return _resp.status(400).send('error');
  } if (headers) {
    return _resp.status(401).send('401');
  }
};

const getOrderProduct = (orderId, dataTableOrder, resp) => {
  getDataByKeyword('orders_products', 'orderId', orderId)
    .then((products) => {
      const order = dataTableOrder[0];
      order._id = (order._id).toString();
      order.userId = (order.userId).toString();
      const dataProduct = products.map((p) => {
        const productID = p.productId;
        return getDataByKeyword('products', '_id', productID);
      });
      Promise.all(dataProduct).then((values) => {
        order.products = values.flat().map((e) => {
          e._id = (e._id).toString();
          return {
            product: e,
          };
        });
        order.products.forEach((x, i) => {
          x.qty = products[i].qty;
        });
        // console.log(order);
        return resp.status(200).send(order);
      })
        .catch((error) => console.error(error));
    })
    .catch((error) => console.error(error));
};

module.exports = {
  pagination,
  dataError,
  getOrderProduct,
};
