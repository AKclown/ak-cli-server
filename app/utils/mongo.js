'use strict';

const cliMongodb = require("@pick-star/cli-mongodb");
const { mongodbUrl, mongodbName } = require('../../config/db');

function mongo() {
  return new cliMongodb(mongodbUrl, mongodbName);
}

module.exports = mongo;
