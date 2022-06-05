/* eslint valid-jsdoc: "off" */

'use strict';

// redis相关常量
const REDIS_PORT = 6379;
const REDIS_HOST = '127.0.0.1';
const REDIS_PWD = '';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1644373474128_9337';

  // add your middleware config here
  config.middleware = [];

  // 跟demo有点差异，因为demo直接导出这个属性
  config.io = {
    namespace: {
      '/': {
        connectionMiddleware: ['auth'],
        packetMiddleware: ['filter'],
      },
      '/chat': {
        connectionMiddleware: ['auth'],
        packetMiddleware: [],
      },
    },
  };

  config.redis = {
    client: {
      port: REDIS_PORT,
      host: REDIS_HOST,
      password: REDIS_PWD,
      db: 0,
    },
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
