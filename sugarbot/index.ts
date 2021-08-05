import * as program from "commander";

// require("pretty-error").start();
require("dotenv").config();

require('./commands/sugarfeed-keeper').cmd(program);
require('./commands/sugarloans-keeper').cmd(program);

program.parse(process.argv);
