# Troubleshooting

**Cannot connect on first try**
Render may be waking up. Wait about 30 seconds and run again.

**Other person does not see my message**
The connection probably dropped or the server restarted, so you are no longer in the room. Use `/exit` and join again.

**Server startup failed due to DB error**
Check `DATABASE_URL` in `.env`.

**Room name already exists**
Names are unique and case-insensitive. Pick another.

**Wrong password**
Passwords are checked by bcrypt against the stored hash. They cannot be recovered; create a new room.
