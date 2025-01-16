const request = require('supertest');
const app = require('../service');

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
  }

beforeEach(async () => {

});


test('get franchises', async () => {
    const getFranchisesRes = await request(app)
      .get('/api/franchise')
    expect(getFranchisesRes.status).toBe(200);
})
