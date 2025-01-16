const request = require('supertest');
const app = require('../service');

let adminToken;
let registerRes;
let registerRes2;

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
const secondTestUser = { name: 'pizza diner 2 ', email: '2@test.com', password: 'a' };


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
});

test('get menu', async () => {
    const getMenuRes = await request(app)
      .get('/api/order/menu')
    expect(getMenuRes.status).toBe(200);
})

test('add menu item', async () => {
    const addMenuItemRes = await request(app)
      .put('/api/order/menu').set('Authorization', `Bearer ${adminToken}`).send({ title: randomName() , description: 'Veggie', image: '', price: 0.05 });
    expect(addMenuItemRes.status).toBe(200);
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

