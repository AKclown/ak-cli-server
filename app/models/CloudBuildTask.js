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

module.exports = CloudBuildTask;
