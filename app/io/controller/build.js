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

// 构建准备工作
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

// 下载源码
async function download(cloudBuildTask, socket, helper) {
  socket.emit('build', helper.parseMsg('download repo', {
    message: '开始下载源码',
  }));
  const downloadRes = await cloudBuildTask.download();
  if (!downloadRes || downloadRes.code === FAILED) {
    socket.emit('build', helper.parseMsg('download failed', {
      message: '源码下载失败',
    }));
    return;
  }
  socket.emit('build', helper.parseMsg('download repo', {
    message: '源码下载成功',
  }));
}

// 安装依赖
async function install(cloudBuildTask, socket, helper) {
  socket.emit('build', helper.parseMsg('install', {
    message: '开始安装依赖',
  }));
  const installRes = await cloudBuildTask.install();
  if (!installRes || installRes.code === FAILED) {
    socket.emit('build', helper.parseMsg('install failed', {
      message: '安装依赖失败',
    }));
    return;
  }
  socket.emit('build', helper.parseMsg('install', {
    message: '安装依赖成功',
  }));
}

// 云构建
async function build(cloudBuildTask, socket, helper) {
  socket.emit('build', helper.parseMsg('build', {
    message: '开始启动云构建',
  }));
  const buildRes = await cloudBuildTask.build();
  if (!buildRes || buildRes.code === FAILED) {
    socket.emit('build', helper.parseMsg('build failed', {
      message: '云构建任务失败',
    }));
    return;
  }
  socket.emit('build', helper.parseMsg('build', {
    message: '云构建任务成功',
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
        // 准备
        await prepare(cloudBuildTask, socket, helper);
        // 源码下载
        await download(cloudBuildTask, socket, helper);
        // 依赖安装
        await install(cloudBuildTask, socket, helper);
        // 云构建
        await build(cloudBuildTask, socket, helper);
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
