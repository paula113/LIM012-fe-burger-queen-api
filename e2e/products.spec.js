/* eslint-disable no-console */
jest.setTimeout(500000);

const { getDataByKeyword } = require('../db-data/sql_functions');

const {
  fetch,
  fetchAsTestUser,
  fetchAsAdmin,
} = process;

describe('POST /products', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/products', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 403 when not admin', () => (
    fetchAsTestUser('/products', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(403))
  ));

  it('should fail with 400 when bad props', () => (
    fetchAsAdmin('/products', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should create product as admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'test1', price: 5 },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(typeof json._id).toBe('string');
        expect(typeof json.name).toBe('string');
        expect(typeof json.price).toBe('number');
        return json._id;
      })
      .then((id) => {
        console.log(id);
        fetchAsAdmin(`/products/${id}`, {
          method: 'DELETE',
        });
      })
  ));
});

describe('GET /products', () => {
  it('should get products with Auth', () => (
    fetchAsTestUser('/products')
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(Array.isArray(json)).toBe(true);
        json.forEach((product) => {
          expect(typeof product._id).toBe('string');
          expect(typeof product.name).toBe('string');
          expect(typeof product.price).toBe('number');
        });
      })
  ));
});

describe('GET /products/:productid', () => {
  it('should fail with 404 when not found', () => (
    fetchAsTestUser('/products/notarealproduct')
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should get product with Auth', () => (
    fetchAsTestUser('/products')
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(Array.isArray(json)).toBe(true);
        expect(json.length > 0).toBe(true);
        json.forEach((product) => {
          // eslint-disable-next-line no-console
          console.log(product._id);
          expect(typeof product._id).toBe('string');
          expect(typeof product.name).toBe('string');
          expect(typeof product.price).toBe('number');
        });
        return fetchAsTestUser(`/products/${json[0]._id}`)
          .then((resp) => ({ resp, product: json[0] }));
      })
      .then(({ resp, product }) => {
        expect(resp.status).toBe(200);
        return resp.json().then((json) => ({ json, product }));
      })
      .then(({ json, product }) => {
        expect(json).toEqual(product);
      })
  ));
});

describe('PUT /products/:productid', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/products/xxx', { method: 'PUT' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 403 when not admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'test1', price: 10 },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsTestUser(`/products/${json._id}`, {
        method: 'PUT',
        body: { price: 20 },
      }))
      .then((resp) => expect(resp.status).toBe(403))
      .then(() => getDataByKeyword('products', 'nameProduct', 'test1'))
      .then((data) => {
        console.log(data[0].idProducts);
        fetchAsAdmin(`/products/${data[0].idProducts}`, {
          method: 'DELETE',
        });
      })
    // borrar
    // deleteData('products','name','test');
  ));

  it('should fail with 404 when product not found', () => (
    fetchAsAdmin('/products/12345678901234567890', {
      method: 'PUT',
      body: { price: 1 },
    })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should fail with 400 when bad props', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'test2', price: 10 },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/products/${json._id}`, {
        method: 'PUT',
        body: { price: 'abc' },
      }))
      .then((resp) => expect(resp.status).toBe(400))
      .then(() => getDataByKeyword('products', 'nameProduct', 'test2'))
      .then((data) => {
        console.log(data[0].idProducts);
        fetchAsAdmin(`/products/${data[0].idProducts}`, {
          method: 'DELETE',
        });
      })
  ));

  it('should update product as admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'test3', price: 10 },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/products/${json._id}`, {
        method: 'PUT',
        body: { price: 20 },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => expect(json.price).toBe(20))
      .then(() => getDataByKeyword('products', 'nameProduct', 'test3'))
      .then((data) => {
        console.log(data[0].idProducts);
        fetchAsAdmin(`/products/${data[0].idProducts}`, {
          method: 'DELETE',
        });
      })
  ));
});

describe('DELETE /products/:productid', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/products/xxx', { method: 'DELETE' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 403 when not admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'test4', price: 10 },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsTestUser(`/products/${json._id}`, { method: 'DELETE' }))
      .then((resp) => expect(resp.status).toBe(403))
      .then(() => getDataByKeyword('products', 'nameProduct', 'test4'))
      .then((data) => {
        console.log(data[0].idProducts);
        fetchAsAdmin(`/products/${data[0].idProducts}`, {
          method: 'DELETE',
        });
      })
  ));

  it('should fail with 404 when admin and not found', () => (
    fetchAsAdmin('/products/12345678901234567890', { method: 'DELETE' })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should delete other product as admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'test5', price: 10 },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then(
        ({ _id }) => fetchAsAdmin(`/products/${_id}`, { method: 'DELETE' })
          .then((resp) => ({ resp, _id })),
      )
      .then(({ resp, _id }) => {
        expect(resp.status).toBe(200);
        return fetchAsAdmin(`/products/${_id}`);
      })
      .then((resp) => expect(resp.status).toBe(404))
  ));
});
