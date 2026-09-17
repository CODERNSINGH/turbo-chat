import readline from "readline";
import chalk from "chalk";

/**
 * Starts the live chat session inside a room.
 * @param {import("socket.io-client").Socket} socket
 * @param {string} roomName
 * @param {string} username
 * @returns {Promise<void>}
 */
export function startChat(socket, roomName, username) {
  return new Promise((resolve) => {
    console.clear();
    console.log(
      chalk.bold.cyan(
        "\n======================================================\n" +
        `  FORKTRIX-CHAT  |  Room: ${chalk.yellow(roomName)}\n` +
        `  Logged in as: ${chalk.green(username)}\n` +
        `  Commands: Type ${chalk.magenta("/exit")} to leave the room.\n` +
        "======================================================\n"
      )
    );

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.bold.cyan("You > "),
    });

    // Helper to log without disturbing the current typing prompt
    function safeLog(message) {
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
      console.log(message);
      rl.prompt(true);
    }

    // Format ISO timestamp to local HH:MM:SS
    function formatTime(isoString) {
      const date = isoString ? new Date(isoString) : new Date();
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }

    // Handler for incoming messages
    const onReceiveMessage = ({ username: sender, text, timestamp }) => {
      const timeStr = chalk.gray(`[${formatTime(timestamp)}]`);
      if (sender === username) {
        // Echo sent by server to sender
        safeLog(`${timeStr} ${chalk.bold.cyan("You")}: ${text}`);
      } else {
        safeLog(`${timeStr} ${chalk.bold.yellow(sender)}: ${text}`);
      }
    };

    // Handler for new users joining
    const onUserJoined = ({ username: joinedUser }) => {
      safeLog(chalk.green(`  --> ${chalk.bold(joinedUser)} entered the room.`));
    };

    // Handler for users leaving
    const onUserLeft = ({ username: leftUser }) => {
      safeLog(chalk.dim(`  <-- ${chalk.bold(leftUser)} left the room.`));
    };

    // Attach listeners
    socket.on("receive_message", onReceiveMessage);
    socket.on("user_joined", onUserJoined);
    socket.on("user_left", onUserLeft);

    // Initial prompt display
    rl.prompt();

    // Handle user input
    rl.on("line", (line) => {
      const trimmed = line.trim();

      if (trimmed === "/exit") {
        safeLog(chalk.yellow("\nLeaving room..."));
        cleanup();
        rl.close();
        resolve();
        return;
      }

      if (trimmed.length > 0) {
        // Emit message to server
        socket.emit("send_message", {
          roomName,
          username,
          text: trimmed,
        });
      }

      rl.prompt();
    });

    // Handle Ctrl+C or premature close
    rl.on("close", () => {
      cleanup();
      resolve();
    });

    function cleanup() {
      socket.off("receive_message", onReceiveMessage);
      socket.off("user_joined", onUserJoined);
      socket.off("user_left", onUserLeft);
    }
  });
}
