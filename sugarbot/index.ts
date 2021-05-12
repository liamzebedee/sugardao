import * as program from 'commander';

require('pretty-error').start();
require('dotenv').config();

require('./commands/node').cmd(program);

program.parse(process.argv);