'use strict';

const REDIS_PREFIX = 'cloudbuild';

module.exports = () => {
  return async (ctx, next) => {
    // 获取到客户端传递过来的参数，存储到redis当中
    const { socket, logger, helper, app } = ctx;
    const query = socket.handshake.query;
    const { id } = socket;
    const { redis } = app;
    try {
      // 向这个id发送事件
      socket.emit(id, helper.parseMsg('connect', {
        type: 'connect',
        message: '云构建服务链接成功',
      }));

      let hasTask = await redis.get(`${REDIS_PREFIX}:${id}`);
      if (!hasTask) {
        // 将客户端传入的仓库地址、分支、版本、构建命令... 存入redis当中
        await redis.set(`${REDIS_PREFIX}:${id}`, JSON.stringify(query));
      }
      hasTask = await redis.get(`${REDIS_PREFIX}:${id}`);
      logger.info('query', hasTask);
      await next();
      console.log('disconnect!');
    } catch (error) {
      logger.error('build error', error.message);
    }
  };
};
