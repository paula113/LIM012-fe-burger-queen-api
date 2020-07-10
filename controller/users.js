/* eslint-disable no-console */
// const query = require('../db-data/sql_functions');
const pool = require('../db-data/bq_data');
const { pagination } = require('../utils/utils');

module.exports = {
  getData: (req, resp, next, table) => {
    const { page, limit } = req.query;
    const pages = Number(page);
    const limits = Number(limit);
    pool.query(`SELECT * FROM ${table}`, (error, result) => {
      if (error) throw error;
      const response = pagination(pages, limits, result, table);
      // console.log(response);
      resp.header('link', response.link);
      if (response.list) {
        const jsonUserResp = response.list.map((x) => {
          console.log(`${x.email} soy admin? ${x.rolesAdmin}`);
          const role = x.rolesAdmin === 1;
          return {
            _id: x.id,
            email: x.email,
            roles: { admin: role },
          };
        });
        const jsonOrdersResp = response.list.map((x) => ({
          _id: x.idProducts,
          name: x.nameProduct,
          price: x.price,
          image: x.image,
          type: x.typeProduct,
          date: x.dateProduct,
        }));
        switch (table) {
          case 'users':
            return resp.status(200).send(jsonUserResp);
          case 'products':
            return resp.status(200).send(jsonOrdersResp);
          default:
            break;
        }
      }
      return resp.status(404).send('Page not found');
    });
  },
};

/**
 * skills github, wix cv,(al final)
 * acerca de: dedicas experiencia proyectos fra,ework,
 * node.js CONOCIEMTOS EN JS FIREBASE CERT. SCRUMB
 * PROYECTOS: PERSONALES
 * experiencia trabajo
 * certificaciones
 * HISTORIA LOGROS
 */
