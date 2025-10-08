# WhatsApp Auto-Poll Bot 🏸

Automatically sends a poll to your WhatsApp group every Saturday at 12:00 PM.

## Features

- ✅ Auto-generates poll with next Wednesday's date
- ✅ Sends poll to "🏸 Badminton 🔥" group
- ✅ Scheduled for every Saturday at 12 PM
- ✅ Persistent session (no need to scan QR every time)
- ✅ Automatic reconnection if disconnected

## Setup Instructions

### 1. Install Dependencies

Open PowerShell in this folder and run:

```bash
npm install
```

### 2. First Run - Scan QR Code

```bash
npm start
```

A QR code will appear in your terminal. Scan it with your phone:
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices
3. Tap "Link a Device"
4. Scan the QR code

### 3. Done!

Once authenticated, the bot will:
- Run continuously in the background
- Send a poll every Saturday at 12:00 PM
- Automatically generate the poll with next Wednesday's date

## Poll Format

**Question:** `[Date] 8-10pm @SLK`  
Example: `15 Oct 8-10pm @SLK`

**Options:**
- On
- Off

**Settings:** Single selection only (no multiple answers)

## Configuration

You can modify the settings in `index.js`:

```javascript
const CONFIG = {
    groupName: '🏸 Badminton 🔥',  // Your group name
    pollLocation: '@SLK',           // Location
    pollTime: '8-10pm',             // Time
    scheduleTime: '0 12 * * 6'      // Cron schedule (Saturday 12 PM)
};
```

### Schedule Format (Cron)

The schedule uses cron syntax: `minute hour day month weekday`

Examples:
- `0 12 * * 6` - Every Saturday at 12:00 PM
- `0 12 * * 0,6` - Every Sunday and Saturday at 12:00 PM
- `0 18 * * 5` - Every Friday at 6:00 PM

### Timezone

Default timezone is set to `Asia/Singapore`. Change it in the code if needed:

```javascript
cron.schedule(CONFIG.scheduleTime, () => {
    sendPoll();
}, {
    timezone: "Asia/Singapore" // Change this
});
```

## Running the Bot

### Keep It Running

To keep the bot running continuously:

```bash
npm start
```

Leave the terminal window open. The bot will send polls automatically.

### Running in Background (Windows)

For running without keeping the terminal open, you can:

1. **Using PowerShell:**
   ```powershell
   Start-Process node -ArgumentList "index.js" -WindowStyle Hidden
   ```

2. **Using Task Scheduler:**
   - Create a new task in Windows Task Scheduler
   - Set trigger: "At system startup"
   - Set action: Run `node.exe` with argument `index.js` in your project folder

## Troubleshooting

### QR Code Not Showing
- Make sure your terminal supports QR code display
- Try running in Windows Terminal or PowerShell

### Group Not Found
- The bot will list all available groups if it can't find your group
- Check the exact group name (including emojis)

### Poll Not Sending
- Check your internet connection
- Make sure WhatsApp is not disconnected on your phone
- Check the console for error messages

### Session Expired
- Delete the `.wwebjs_auth` folder
- Run `npm start` again and scan the QR code

## Manual Test

To test sending a poll immediately (without waiting for Saturday), add this line after the `client.on('ready')` block:

```javascript
// Uncomment to test immediately:
// setTimeout(() => sendPoll(), 5000); // Send after 5 seconds
```

## Stopping the Bot

Press `Ctrl+C` in the terminal to stop the bot gracefully.

---

**Note:** Keep your computer running for the bot to work. Alternatively, deploy it to a cloud server (Heroku, AWS, etc.) for 24/7 operation.

