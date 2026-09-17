import inquirer from "inquirer";
import chalk from "chalk";
import { startChat } from "./chat.js";

/**
 * Main application loop presenting Create Room, Join Room, or Exit.
 * @param {import("socket.io-client").Socket} socket
 */
export async function showMainMenu(socket) {
  let running = true;

  while (running) {
    console.log("");
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Select an option:",
        choices: [
          { name: "Create Room", value: "create" },
          { name: "Join Room", value: "join" },
          { name: "Exit", value: "exit" },
        ],
      },
    ]);

    if (action === "create") {
      await handleCreateRoom(socket);
    } else if (action === "join") {
      await handleJoinRoom(socket);
    } else if (action === "exit") {
      console.log(chalk.cyan("\nExiting Forktrix-Chat. Goodbye.\n"));
      socket.disconnect();
      running = false;
      process.exit(0);
    }
  }
}

/**
 * Handles the "Create Room" interactive flow.
 */
async function handleCreateRoom(socket) {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "roomName",
      message: "Enter room name:",
      validate: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return "Room name cannot be empty.";
        if (trimmed.length > 50) return "Room name cannot exceed 50 characters.";
        return true;
      },
    },
    {
      type: "password",
      name: "password",
      message: "Enter room password:",
      mask: "*",
      validate: (val) => {
        if (!val || !val.trim()) return "Password cannot be empty.";
        return true;
      },
    },
    {
      type: "input",
      name: "username",
      message: "Enter your display name:",
      validate: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return "Display name cannot be empty.";
        if (trimmed.length > 20) return "Display name cannot exceed 20 characters.";
        return true;
      },
    },
  ]);

  const { roomName, password, username } = answers;

  console.log(chalk.gray(`\nCreating room "${roomName.trim()}"...`));

  const result = await new Promise((resolve) => {
    const onJoined = (data) => {
      socket.off("error", onError);
      resolve({ success: true, data });
    };

    const onError = (data) => {
      socket.off("room_joined", onJoined);
      resolve({ success: false, message: data.message || "Failed to create room." });
    };

    socket.once("room_joined", onJoined);
    socket.once("error", onError);

    socket.emit("create_room", {
      roomName: roomName.trim(),
      password,
      username: username.trim(),
    });
  });

  if (!result.success) {
    console.log(chalk.red(`\n[Error] ${result.message}`));
    return;
  }

  // Successfully joined room
  await startChat(socket, result.data.roomName, result.data.username);
}

/**
 * Handles the "Join Room" interactive flow.
 */
async function handleJoinRoom(socket) {
  console.log(chalk.gray("\nFetching available rooms..."));

  // Fetch rooms from server
  const rooms = await new Promise((resolve) => {
    const timeout = setTimeout(() => resolve([]), 5000);
    socket.once("room_list", (list) => {
      clearTimeout(timeout);
      resolve(list || []);
    });
    socket.emit("list_rooms");
  });

  if (!rooms || rooms.length === 0) {
    console.log(chalk.yellow("\n[Notice] No rooms are currently available. Create one first.\n"));
    return;
  }

  const roomChoices = [...rooms, new inquirer.Separator(), "[Back to Main Menu]"];

  const { selectedRoom } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedRoom",
      message: "Select a room to join:",
      choices: roomChoices,
    },
  ]);

  if (selectedRoom === "[Back to Main Menu]") {
    return;
  }

  const details = await inquirer.prompt([
    {
      type: "password",
      name: "password",
      message: `Enter password for "${selectedRoom}":`,
      mask: "*",
      validate: (val) => {
        if (!val || !val.trim()) return "Password cannot be empty.";
        return true;
      },
    },
    {
      type: "input",
      name: "username",
      message: "Enter your display name:",
      validate: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return "Display name cannot be empty.";
        if (trimmed.length > 20) return "Display name cannot exceed 20 characters.";
        return true;
      },
    },
  ]);

  console.log(chalk.gray(`\nJoining room "${selectedRoom}"...`));

  const result = await new Promise((resolve) => {
    const onJoined = (data) => {
      socket.off("error", onError);
      resolve({ success: true, data });
    };

    const onError = (data) => {
      socket.off("room_joined", onJoined);
      resolve({ success: false, message: data.message || "Failed to join room." });
    };

    socket.once("room_joined", onJoined);
    socket.once("error", onError);

    socket.emit("join_room", {
      roomName: selectedRoom,
      password: details.password,
      username: details.username.trim(),
    });
  });

  if (!result.success) {
    console.log(chalk.red(`\n[Error] ${result.message}`));
    return;
  }

  // Successfully joined room
  await startChat(socket, result.data.roomName, result.data.username);
}
