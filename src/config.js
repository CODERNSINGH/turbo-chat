// Check if user passed --server <url> in command line arguments
function getServerUrlFromArgs() {
  const args = process.argv.slice(2);
  const serverFlagIndex = args.indexOf("--server");
  if (serverFlagIndex !== -1 && args[serverFlagIndex + 1]) {
    return args[serverFlagIndex + 1];
  }
  return null;
}

export const SERVER_URL =
  getServerUrlFromArgs() ||
  process.env.SERVER_URL ||
  "https://turbo-chat-2wuy.onrender.com";
