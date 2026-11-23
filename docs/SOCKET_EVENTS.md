# Socket Events

| Event | Direction | Payload | What it does |
|---|---|---|---|
| list_rooms | client -> server | none | Ask for room names |
| room_list | server -> client | string[] | Room names |
| create_room | client -> server | roomName, password, username | Make a room and join it |
| join_room | client -> server | roomName, password, username | Check password and join |
| room_joined | server -> client | roomName, username | You are in |
| user_joined | server -> room | username | Someone else joined |
| send_message | client -> server | text | Send a chat message (server knows your room) |
| receive_message | server -> room | username, text, timestamp | A new message |
| leave_room | client -> server | none | Leave but stay connected |
| user_left | server -> room | username | Someone left or disconnected |
| not_in_room | server -> client | none | You sent a message but the server has no room for you |
| error | server -> client | message | Something failed |
