#!/usr/bin/env node

import chalk from "chalk";
import { connectSocket } from "../src/socket.js";
import { showMainMenu } from "../src/menu.js";
import { SERVER_URL } from "../src/config.js";

async function main() {
  console.clear();
  console.log(
    chalk.cyanBright(`
======================================================
  ______ ____  _____  _  _______ _____  _______   __
 |  ____/ __ \\|  __ \\| |/ /__   __|  __ \\|_   _\\ \\ / /
 | |__ | |  | | |__) | ' /   | |  | |__) | | |  \\ V / 
 |  __|| |  | |  _  /|  <    | |  |  _  /  | |   > <  
 | |   | |__| | | \\ \\| . \\   | |  | | \\ \\ _| |_ / . \\ 
 |_|    \\____/|_|  \\_\\_|\\_\\  |_|  |_|  \\_\\_____/_/ \\_\\
                                                     
         FORKTRIX-CHAT | Terminal Chat System
======================================================
    `)
  );

  console.log(chalk.gray(`Target Server: ${SERVER_URL}`));

  try {
    const socket = await connectSocket();
    console.log(chalk.green("Connected successfully to Forktrix-Chat server.\n"));

    await showMainMenu(socket);
  } catch (err) {
    console.error(chalk.red(`\n[Connection Error]\n${err.message}\n`));
    console.log(
      chalk.yellow(
        "Tip: Ensure the server is running or specify a server URL using '--server <url>'.\n"
      )
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error:"), err);
  process.exit(1);
});
