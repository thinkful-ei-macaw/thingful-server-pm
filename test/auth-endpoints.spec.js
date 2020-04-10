const knex = require('knex');
const jwt = require('jsonwebtoken')
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Auth Endpoints', function() {
  let db;

  const {
    testUsers,
    testThings,
  } = helpers.makeThingsFixtures();

  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));


  describe('POST /api/auth/login', () => {
    const requiredFields = ['user_name', 'password'];
    requiredFields.forEach( field => {
      const loginAttemptBody = {
        user_name: testUser.user_name,
        password: testUser.password
      }
      it(`responds with 400 bad reqest when there is no ${field}`, () => {
        delete loginAttemptBody[field]
        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttemptBody)
          .expect(400, {
            error: `You are missing your ${field}`
          });
      });
    });

    it(`responds 400 'Invalid Credentials' when bad user_name`, () => {
      const invalidUser = {user_name: 'user-not', password: 'existy'}
      return supertest(app)
        .post('/api/auth/login')
        .send(invalidUser)
        .expect(400, {error: 'Invalid Credentials'})
    });

    it(`respond 400 'Invalid Credentials' when bad password`, () => {
      const badPassword = { user_name: testUser.user_name, password: 'bad'}
      return supertest(app)
        .post('/api/auth/login')
        .send(badPassword)
        .expect(400, {error: 'Invalid Credentials'})
    });

    it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
      const userValidCreds = {
        user_name: testUser.user_name,
        password: testUser.password,
      }
      const expectedToken = jwt.sign(
        { user_id: testUser.id }, // payload
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          algorithm: 'HS256',
        }
      )
      return supertest(app)
        .post('/api/auth/login')
        .send(userValidCreds)
        .expect(200, {
          authToken: expectedToken,
        })
    })
  });

});