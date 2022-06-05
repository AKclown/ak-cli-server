'use strict';

const Controller = require('egg').Controller;
const mongo = require('../utils/mongo');
class ProjectController extends Controller {
  async getTemplate() {
    const { ctx } = this;
    const data = await mongo().query('template');
    ctx.body = data;
  }

  async getRedis() {
    const { ctx, app } = this;
    const { key } = ctx.query;
    if (key) {
      const value = await app.redis.get(key);
      ctx.body = `redis[${key}]:${value}`;
    } else {
      ctx.body = '请提供参数key';
    }
  }
}

module.exports = ProjectController;
