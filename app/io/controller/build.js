'use strict';
const CloudBuildTask = require('../../models/CloudBuildTask');
const { FAILED } = require('../constants');
const REDIS_PREFIX = 'cloudbuild';

async function createCloudBuildTask(ctx, app) {
  const { socket, helper } = ctx;
  const client = socket.id;
  const redisKey = `${REDIS_PREFIX}:${client}`;
  const redisTask = await app.redis.get(redisKey);
  const task = JSON.parse(redisTask);
  socket.emit('build', helper.parseMsg('create task', {
    message: '创建云构建任务',
  }));
  return new CloudBuildTask({
    repo: task.reop,
    name: task.name,
    version: task.version,
    branch: task.branch,
    buildCmd: task.buildCmd,
  }, ctx);
}

async function prepare(cloudBuildTask, socket, helper) {
  socket.emit('build', helper.parseMsg('prepare', {
    message: '开始执行构建前准备工作',
  }));
  const prepareRes = await cloudBuildTask.prepare();
  if (!prepareRes || prepareRes.code === FAILED) {
    socket.emit('build', helper.parseMsg('prepare failed', {
      message: '执行构建前准备工作失败',
    }));
    return;
  }
  socket.emit('build', helper.parseMsg('prepare', {
    message: '构建前准备工作成功',
  }));
}

module.exports = app => {
  class Controller extends app.Controller {
    async index() {
      // 从this实例可以拿到ctx
      const { ctx, app } = this;
      const { socket, helper } = ctx;
      // 创建cloudBuildTask实例化
      const cloudBuildTask = await createCloudBuildTask(ctx, app);
      try {
        await prepare(cloudBuildTask, socket, helper);
      } catch (error) {
        socket.emit('build', helper.parseMsg('error', {
          message: '云构建失败，失败原因:' + error.message,
        }));
        socket.disconnect();
      }
    }
  }
  return Controller;
};
