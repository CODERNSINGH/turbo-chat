import { io } from "socket.io-client";
import chalk from "chalk";
import { SERVER_URL } from "./config.js";

let socketInstance = null;

/**
 * Initializes and establishes connection to the Forktrix-Chat server.
 * @returns {Promise<import("socket.io-client").Socket>}
 */
export function connectSocket() {
  return new Promise((resolve, reject) => {
    if (socketInstance && socketInstance.connected) {
      return resolve(socketInstance);
    }

    console.log(chalk.gray(`Connecting to server at ${SERVER_URL}...`));

    const socket = io(SERVER_URL, {
      reconnectionAttempts: 3,
      timeout: 7000,
      transports: ["websocket", "polling"],
    });

    socket.once("connect", () => {
      socketInstance = socket;
      resolve(socket);
    });

    socket.once("connect_error", (err) => {
      reject(
        new Error(
          `Unable to connect to Forktrix-Chat server at ${SERVER_URL}.\n` +
          `Please verify that the server is running.\nDetails: ${err.message}`
        )
      );
    });
  });
}

/**
 * Disconnects the active socket connection if present.
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
