'use strict';

// 启动socket.io服务
exports.io = {
  enable: true,
  package: 'egg-socket.io',
};

// 启动redis服务
exports.redis = {
  enable: true,
  package: 'egg-redis',
};
