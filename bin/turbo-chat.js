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
  _____ _   _ ____  ____   ___         ____ _   _    _  _____ 
 |_   _| | | |  _ \\| __ ) / _ \\       / ___| | | |  / \\|_   _|
   | | | | | | |_) |  _ \\| | | |_____| |   | |_| | / _ \\ | |  
   | | | |_| |  _ <| |_) | |_| |_____| |___|  _  |/ ___ \\| |  
   |_|  \\___/|_| \\_\\____/ \\___/       \\____|_| |_/_/   \\_\\_|  
                                                              
        Fast, Lightweight Real-Time Terminal Chat
======================================================
    `)
  );

  console.log(chalk.gray(`Target Server: ${SERVER_URL}`));

  try {
    const socket = await connectSocket();
    console.log(chalk.green("Connected successfully to Turbo-Chat server!\n"));

    await showMainMenu(socket);
  } catch (err) {
    console.error(chalk.red(`\n✖ Connection Error:\n${err.message}\n`));
    console.log(
      chalk.yellow(
        "Tip: Make sure the server is started with 'npm run server' or supply '--server <url>'.\n"
      )
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error:"), err);
  process.exit(1);
});
