/* eslint-disable array-callback-return */
jest.setTimeout(10000000);
const sinon = require('sinon');
// Mockear MySQL con sinon
const mockMysql = sinon.mock(require('mysql'));
// Crear stub para connect
const connectStub = sinon.stub().callsFake(() => {
  // cb();
});
// Crear stub para query
const queryStub = sinon.stub();
// Crear stub para end
// const endStub = sinon.stub();
// Cuando se cree la conexión, reemplazar resultado con stubs
mockMysql.expects('createConnection').returns({
  connect: connectStub,
  query: queryStub,
  // end: endStub,
});

// Invocar nuestra libreria/metodos a probar
const db = require('../../db-data/sql_functions');

const users = [
  {
    _id: 1010001,
    email: 'test@test.test',
    password: 'password12345',
    rolesAdmin: true,
  }];
const error = new Error('error');

describe('Funcion getAllData(table)', () => {
  // get all data
  it('should throw error if data is null', () => {
    // en vez de llamar .query llama al callFake
    queryStub.callsFake((query, cb) => {
      cb(error, []);
    });
    return db.getAllData('users')
      .catch((error) => {
        expect(error.message).toBe('error');
      });
  });

  it('should return data if exits from users', () => {
    // en vez de llamar .query llama al callFake
    queryStub.callsFake((query, cb) => {
      cb('error', users);
    });
    return db.getAllData('users')
      .then((result) => {
        result.map((result) => {
          expect(typeof result._id).toBe('number');
          expect(result._id).toBe(1010001);
          expect(typeof result.email).toBe('string');
          expect(result.email).toBe('test@test.test');
          expect(typeof result.password).toBe('string');
          expect(result.password).toBe('password12345');
        });
      });
  });
  // get all data by keyword
});

describe('Function getDataByKeyword(table, keyword, value)', () => {
  // get all data
  it('should throw error if data is null', () => {
    // en vez de llamar .query llama al callFake
    queryStub.callsFake((query, value, cb) => {
      const result = users.filter((user) => user._id === value);
      cb(error, result);
    });
    return db.getDataByKeyword('users', '_id', 1010002)
      .catch((error) => {
        expect(error.message).toBe('error');
      });
  });

  it('should return data if exits from users by _id', () => {
    // en vez de llamar .query llama al callFake
    queryStub.callsFake((query, value, cb) => {
      const result = users.filter((user) => user._id === value);
      cb(error, result);
    });
    return db.getDataByKeyword('users', '_id', 1010001)
      .then((result) => {
        expect(typeof result[0]._id).toBe('number');
        expect(result[0]._id).toBe(1010001);
      });
  });
  it('should return data if exits from users by email', () => {
    // en vez de llamar .query llama al callFake
    queryStub.callsFake((query, value, cb) => {
      const result = users.filter((user) => user.email === value);
      cb(error, result);
    });
    return db.getDataByKeyword('users', 'email', 'test@test.test')
      .then((result) => {
        expect(typeof result[0]._id).toBe('number');
        expect(result[0]._id).toBe(1010001);
        expect(result[0].email).toBe('test@test.test');
        expect(typeof result[0].email).toBe('string');
      });
  });
});

describe('Function postData(table, toInsert)', () => {
  // get all data
  it('should return data if exits from users', () => {
    // en vez de llamar .query llama al callFake
    queryStub.callsFake((query, toInsert, cb) => {
      users.push(toInsert);
      cb(error, users);
    });
    const newUser = {
      _id: 1010002,
      email: 'newuser@test.test',
      password: 'password12345',
      rolesAdmin: false,
    };
    return db.postData('users', newUser)
      .then((result) => {
        expect(result.some((user) => user._id === 1010002)).toBe(true);
      });
  });
});

describe('Function updateDataByKeyword(table, toUpdate, keyword, value)', () => {
  it('Should update a user by email', () => {
    queryStub.callsFake((query, [toUpdate, value], cb) => {
      const userByKeyword = users.filter((user) => user.email === value);
      const { password, rolesAdmin } = toUpdate;
      const result = userByKeyword[0];
      result.password = (password) || userByKeyword[0].password;
      result.rolesAdmin = (rolesAdmin) || userByKeyword[0].rolesAdmin;
      cb(error, result);
    });

    return db.updateDataByKeyword('users', { password: '123456' }, 'email', 'test@test.test')
      .then((result) => {
        expect(result.password).toBe('123456');
      });
  });
  it('Should update a user by _id', () => {
    queryStub.callsFake((query, [toUpdate, idvalue], cb) => {
      const userByKeyword = users.filter((user) => user._id === idvalue);
      const { password, rolesAdmin } = toUpdate;
      const result = userByKeyword[0];
      result.rolesAdmin = rolesAdmin;
      result.password = (password) || userByKeyword[0].password;
      cb(error, result);
    });

    return db.updateDataByKeyword('users', { password: 'newpassword', rolesAdmin: false }, '_id', 1010001)
      .then((result) => {
        expect(result.password).toBe('newpassword');
        expect(typeof result.password).toBe('string');
        expect(result.rolesAdmin).toBe(false);
      });
  });
});

describe('Function deleteData(table, id, idValue)', () => {
  it('Should delete a user by email', () => {
    queryStub.callsFake((query, emailValue, cb) => {
      const result = users.filter((user) => user.email !== emailValue);
      cb(error, result);
    });
    return db.deleteData('users', 'email', 'newuser@test.test')
      .then((result) => {
        const userDeleted = users.filter((user) => user.email === 'newuser@test.test');
        expect(result).toEqual(
          expect.not.arrayContaining(userDeleted),
        );
      });
  });
  it('Should delete a user by _id', () => {
    queryStub.callsFake((query, idValue, cb) => {
      const result = users.filter((user) => user._id !== idValue);
      cb(error, result);
    });
    return db.deleteData('users', '_id', 1010001)
      .then((result) => {
        const userDeleted = users.filter((user) => user._id === 1010001);
        expect(result).toEqual(
          expect.not.arrayContaining(userDeleted),
        );
      });
  });
});
