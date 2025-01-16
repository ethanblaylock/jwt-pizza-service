const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
const secondTestUser = { name: 'pizza diner 2 ', email: '2@test.com', password: 'a' };

let franchiseeUser;
let adminToken;
let registerRes;
let registerRes2;

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
  }

beforeEach(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    registerRes = await request(app).post('/api/auth').send(testUser);
    secondTestUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    registerRes2 = await request(app).post('/api/auth').send(secondTestUser);
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

test('create franchise bad email', async () => {
    const createFranchiseRes =  await request(app)
    .post('/api/franchise').set('Authorization', `Bearer ${adminToken}`).send({ name: randomName(), admins: [{ email: 'fakeemail' }]});
    expect(createFranchiseRes.status).toBe(404);
})

test('delete franchise', async () => {
    const deleteFranchiseRes = await request(app)
      .delete(`/api/franchise/${franchiseeUser.body.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(deleteFranchiseRes.status).toBe(200);
})

test('delete franchise not admin', async () => {
    const deleteFranchiseRes = await request(app)
      .delete(`/api/franchise/${franchiseeUser.body.id}`).set('Authorization', `Bearer ${registerRes.body.token}`);
    expect(deleteFranchiseRes.status).toBe(403);
})

test('create store', async () => {
    const createStoreRes = await request(app)
      .post(`/api/franchise/${franchiseeUser.body.id}/store`).set('Authorization', `Bearer ${registerRes.body.token}`).send({ franchiseId: franchiseeUser.body.id , name: randomName() });
    expect(createStoreRes.status).toBe(200);
})

test('create store not admin', async () => {
    const createStoreRes = await request(app)
      .post(`/api/franchise/${franchiseeUser.body.id}/store`).set('Authorization', `Bearer ${registerRes2.body.token}`).send({ franchiseId: -1 , name: randomName() });
    expect(createStoreRes.status).toBe(403);
})

test('delete store', async () => {
    const createStoreRes = await request(app)
      .post(`/api/franchise/${franchiseeUser.body.id}/store`).set('Authorization', `Bearer ${registerRes.body.token}`).send({ franchiseId: franchiseeUser.body.id , name: randomName() });
    const deleteStoreRes = await request(app)
      .delete(`/api/franchise/${franchiseeUser.body.id}/store/${createStoreRes.body.id}`).set('Authorization', `Bearer ${registerRes.body.token}`);
    expect(deleteStoreRes.status).toBe(200);
})

test('delete store not admin', async () => {
    const createStoreRes = await request(app)
      .post(`/api/franchise/${franchiseeUser.body.id}/store`).set('Authorization', `Bearer ${registerRes.body.token}`).send({ franchiseId: franchiseeUser.body.id , name: randomName() });
    const deleteStoreRes = await request(app)
      .delete(`/api/franchise/${franchiseeUser.body.id}/store/${createStoreRes.body.id}`).set('Authorization', `Bearer ${registerRes2.body.token}`);
    expect(deleteStoreRes.status).toBe(403);
})

test('add franchise user to DB', async () => {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Franchisee, object: 1}] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  expect(user).toBeDefined();
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