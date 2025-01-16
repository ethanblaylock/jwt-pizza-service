const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let franchiseeUser;
let adminToken;
let resgisterRes;

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
  }

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    registerRes = await request(app).post('/api/auth').send(testUser);
    const adminUser = await createAdminUser();
    const loginAdminRes = await request(app).put('/api/auth').send({ email: adminUser.email, password: adminUser.password });
    adminToken = loginAdminRes.body.token;
    franchiseeUser = await request(app)
      .post('/api/franchise').set('Authorization', `Bearer ${loginAdminRes.body.token}`).send({ name: randomName(), admins: [{ email: `${testUser.email}` }]});
});


test('get franchises', async () => {
    const getFranchisesRes = await request(app)
      .get('/api/franchise')
    expect(getFranchisesRes.status).toBe(200);
})

test('get franchises by user', async () => {
    const getFranchisesByUserRes = await request(app)
      .get(`/api/franchise/${franchiseeUser.body.admins[0].id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(getFranchisesByUserRes.status).toBe(200);
})

test('create franchise not admin', async () => {
    const createFranchiseRes =  await request(app)
    .post('/api/franchise').set('Authorization', `Bearer ${registerRes.body.token}`).send({ name: randomName(), admins: [{ email: `${testUser.email}` }]});
  expect(createFranchiseRes.status).toBe(403);
})

test('delete franchise', async () => {
})

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

const { Role, DB } = require('../database/database.js');

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin}] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}