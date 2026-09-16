import { io } from "socket.io-client";
import { spawn } from "child_process";

const SERVER_URL = "http://localhost:3000";

async function runEndToEndTest() {
  console.log("Starting server process...");
  const serverProcess = spawn("node", ["server/index.js"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (data) => {
    // console.log("[SERVER]", data.toString().trim());
  });

  serverProcess.stderr.on("data", (data) => {
    console.error("[SERVER ERR]", data.toString().trim());
  });

  // Wait for server to boot
  await new Promise((r) => setTimeout(r, 2000));

  console.log("Connecting Client 1 (Alice)...");
  const client1 = io(SERVER_URL);

  await new Promise((resolve) => client1.once("connect", resolve));
  console.log("Client 1 connected!");

  const testRoom = `test-${Date.now()}`;

  // Test 1: Create room
  console.log(`Test 1: Client 1 creating room "${testRoom}"...`);
  const roomJoined1Promise = new Promise((resolve, reject) => {
    client1.once("room_joined", resolve);
    client1.once("error", reject);
  });
  client1.emit("create_room", {
    roomName: testRoom,
    password: "secretpassword",
    username: "Alice",
  });
  const joinedResult1 = await roomJoined1Promise;
  console.log("Test 1 Passed: Room created & joined:", joinedResult1);

  // Test 2: Connecting Client 2 (Bob) and listing rooms
  console.log("Test 2: Connecting Client 2 and fetching room list...");
  const client2 = io(SERVER_URL);
  await new Promise((resolve) => client2.once("connect", resolve));

  const listRoomsPromise = new Promise((resolve) => {
    client2.once("room_list", resolve);
  });
  client2.emit("list_rooms");
  const roomList = await listRoomsPromise;
  console.log("Fetched rooms:", roomList);
  if (!roomList.includes(testRoom)) {
    throw new Error(`Test 2 Failed: Room ${testRoom} not found in room list.`);
  }
  console.log("Test 2 Passed: Room found in list.");

  // Test 3: Join with wrong password
  console.log("Test 3: Testing wrong password rejection...");
  const wrongPasswordPromise = new Promise((resolve) => {
    client2.once("error", resolve);
  });
  client2.emit("join_room", {
    roomName: testRoom,
    password: "wrongpassword",
    username: "Bob",
  });
  const errorResult = await wrongPasswordPromise;
  console.log("Received expected error:", errorResult);
  if (!errorResult.message.includes("Incorrect password")) {
    throw new Error("Test 3 Failed: Did not receive incorrect password message.");
  }
  console.log("Test 3 Passed: Password validation works.");

  // Test 4: Join with correct password
  console.log("Test 4: Joining with correct password...");
  const userJoinedAlicePromise = new Promise((resolve) => {
    client1.once("user_joined", resolve);
  });
  const bobJoinedPromise = new Promise((resolve, reject) => {
    client2.once("room_joined", resolve);
    client2.once("error", reject);
  });
  client2.emit("join_room", {
    roomName: testRoom,
    password: "secretpassword",
    username: "Bob",
  });
  const [bobJoined, aliceNotified] = await Promise.all([
    bobJoinedPromise,
    userJoinedAlicePromise,
  ]);
  console.log("Bob joined:", bobJoined);
  console.log("Alice received user_joined notification:", aliceNotified);
  console.log("Test 4 Passed: Joining and broadcast notification work.");

  // Test 5: Messaging between Alice and Bob
  console.log("Test 5: Testing real-time messaging...");
  const aliceMsgPromise = new Promise((resolve) => {
    client1.once("receive_message", resolve);
  });
  const bobMsgPromise = new Promise((resolve) => {
    client2.once("receive_message", resolve);
  });

  client2.emit("send_message", {
    roomName: testRoom,
    username: "Bob",
    text: "Hey Alice, this is turbo-chat!",
  });

  const [aliceMsg, bobMsg] = await Promise.all([aliceMsgPromise, bobMsgPromise]);
  console.log("Alice received:", aliceMsg);
  console.log("Bob received:", bobMsg);
  if (aliceMsg.text !== "Hey Alice, this is turbo-chat!") {
    throw new Error("Test 5 Failed: Message text mismatch.");
  }
  console.log("Test 5 Passed: Instant message broadcast verified.");

  // Test 6: User left notification on disconnect
  console.log("Test 6: Disconnecting Bob and verifying user_left notification...");
  const userLeftPromise = new Promise((resolve) => {
    client1.once("user_left", resolve);
  });
  client2.disconnect();
  const leftNotification = await userLeftPromise;
  console.log("Alice received user_left:", leftNotification);
  if (leftNotification.username !== "Bob") {
    throw new Error("Test 6 Failed: User left name mismatch.");
  }
  console.log("Test 6 Passed: Disconnect notification works.");

  // Clean up
  client1.disconnect();
  serverProcess.kill("SIGTERM");
  console.log("\nALL TESTS PASSED SUCCESSFULLY! 🎉\n");
  process.exit(0);
}

runEndToEndTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
