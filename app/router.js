'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/project/template', controller.project.getTemplate);
  router.get('/redis/test', controller.project.getRedis);

  // app.io.of('/')
  app.io.route('chat', app.io.controller.chat.index);

  // app.io.of('/chat')
  // 这个of是什么含义呢？ app.io讲的就是我们的websocket服务，那么这个of就是将我们的路由namespace和我们的middleware进行映射。
  // 每一个websocket首先会发起一个http请求来获取这个链接。所以/chat完成的就是第一次http链接，而链接之后在进行的服务之间的映射通过后面的route来处理
  app.io.of('/chat').route('chat', app.io.controller.chat.index);
};
