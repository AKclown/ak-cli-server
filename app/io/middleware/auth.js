'use strict';

module.exports = () => {
  return async (ctx, next) => {
    // 获取到客户端传递过来的参数，存储到redis当中
    const { socket, logger, helper } = ctx;
    const query = socket.handshake.query;
    const { id } = socket;
    try {
      // 向这个id发送事件
      socket.emit(id, helper.parseMsg('connect', {
        type: 'connect',
        message: '云构建服务链接成功',
      }));
      logger.info('query', query);
      await next();
      console.log('disconnect!');
    } catch (error) {
      logger.error('build error', error.message);
    }
  };
};
