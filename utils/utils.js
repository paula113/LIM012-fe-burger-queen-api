/* eslint-disable no-control-regex */
const pagination = (pagesNumber, limits, result, table) => {
  const port = process.argv[2] || process.env.PORT || 8080;
  const pages = (!pagesNumber) ? 1 : pagesNumber;
  const startIndex = (pages - 1) * limits;
  const endIndex = pages * limits;
  const usersQueryLimits = result.slice(startIndex, endIndex);
  const totalPages = Math.round(result.length / limits);
  const previousPage = pages - 1;
  const nextPage = pages + 1;

  let link = `<https://localhost:${port}/${table}?page=1&limit=${limits}>; rel="first",<https://localhost:${port}/${table}?page=${totalPages}&limit=${limits}>; rel="last"`;
  const results = {
    link,
  };

  if (pages > 0 && pages < (totalPages + 1)) {
    const prev = `,<https://localhost:${port}/${table}?page=${previousPage}&limit=${limits}>; rel="previous",`;
    const next = `<https://localhost:${port}/${table}?page=${nextPage}&limit=${limits}>; rel="next"`;
    link = link.concat(prev, next);
    results.link = link;
    results.list = usersQueryLimits;
  } else if (!limits) {
    results.list = result;
  }
  // eslint-disable-next-line no-console
  console.log(results.link);
  return results;
};

const dataError = (condition, headers, message, _resp) => {
  if (condition) {
    return _resp.status(400).send(message);
  } if (headers) {
    return _resp.status(401).send({ mensaje: 'Missing token auth' });
  }
};
const validate = (email) => {
  // eslint-disable-next-line no-useless-escape
  const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
  return expression.test(String(email).toLowerCase());
};
const valPassword = (str) => {
  const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])\w{6,}$/;
  return re.test((str));
};

module.exports = {
  pagination,
  dataError,
  validate,
  valPassword,
};
