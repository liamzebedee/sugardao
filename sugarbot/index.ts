import * as program from 'commander';

require('pretty-error').start();
require('dotenv').config();

require('./commands/sugarfeed-keeper').cmd(program);

program.parse(process.argv);