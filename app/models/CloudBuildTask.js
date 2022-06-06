'use strict';
const fs = require('fs');
const path = require('path');
const userhome = require('userhome')();
const fse = require('fs-extra');
const Git = require('simple-git');
const { FAILED, SUCCESS } = require('../constants');

class CloudBuildTask {
  constructor(options, ctx) {
    this._ctx = ctx;
    this._logger = this._ctx._logger;
    this._name = options.name; // 仓库名称
    this._version = options.version; // 版本号
    this._repo = options.repo; // 远程仓库地址
    this._branch = options.branch; // 分支
    this._buildCmd = options.buildCmd; // 构建命令
    this._dir = path.resolve(userhome, '.ak-cli-dev', 'cloudbuild', `${this._name}:${this._version}`); // 缓存目录
    this._sourceCodeDir = path.resolve(this._dir, this._name); // 缓存源码目录
    this._logger.info('_dir', this._dir);
    this._logger.info('_sourceCodeDir', this._sourceCodeDir);

    this._git = null;
  }

  async prepare() {
    // 检查缓存目录，并且清空缓存目录
    fse.ensureDirSync(this._dir);
    fse.emptyDirSync(this._dir);
    this._git = new Git(this._dir);
    return this.success();
  }

  // 下载源码
  async download() {
    // clone 仓库
    await this._git.clone(this._repo);
    // !注意这里不在是this._dir，而是在这个路径的基础下载创建新的版本目录
    this._git = new Git(this._sourceCodeDir);
    // 切换branch分支， git checkout -b dev/1.1.1 origin/dev/1.1.1
    await this._git.checkout([
      '-b',
      this._branch,
      `origin/${this._branch}`,
    ]);
    return fs.existsSync(this._sourceCodeDir) ? this.success() : this.failed();
  }

  // 安装依赖
  async install() {
    let res = true;
    res && (res = await this.execCommand('npm install --registry https://registry.npm.taobao.org'));
    return res ? this.success() : this.failed();
  }

  // 执行脚本方法
  execCommand(command) {
    // npm install --> ['npm','install']
    const commands = command.split(' ');
    if (commands.length === 0) {
      return null;
    }
    const firstCommand = commands[0];
    const leftCommand = commands.slice(1) || [];
    return new Promise(resolve => {
      const p = exec(firstCommand, leftCommand, {
        cwd: this._sourceCodeDir,
      }, { stdio: 'pipe' });
      // 日志监听
      p.on('error', error => {
        this._logger.error('build error', error);
        resolve(false);
      });
      p.on('exit', code => {
        this._logger.info('build exit', code);
        resolve(true);
      });
      // $ 如下两个监听都不会中断，最终还是得执行到error|exit的监听才结束，所以不需要调用resolve方法
      p.stdout.on('data', data => {
        // 这里的data是buffer类型，需要toString一下
        this._ctx.socket.emit('building', data.toString());
      });
      p.stderr.on('data', data => {
        this._ctx.socket.emit('building', data.toString());
      });
    });
  }

  // 成功返回
  success(message, data) {
    return this.response(SUCCESS, message, data);
  }

  // 失败返回
  failed(message, data) {
    return this.response(FAILED, message, data);
  }

  // 统一的response
  response(code, message, data) {
    return { code, message, data };
  }
}

// 执行 脚本命令
function exec(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return require('child_process').spawn(cmd, cmdArgs, options || {});
}

module.exports = CloudBuildTask;
