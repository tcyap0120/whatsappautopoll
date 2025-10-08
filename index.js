const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

// Initialize WhatsApp client with session persistence
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    }
});

// Configuration
const CONFIG = {
    groupName: '🏸 Badminton 🔥',
    pollLocation: '@SLK',
    pollTime: '8-10pm',
    scheduleTime: '0 12 * * 6' // Every Saturday at 12:00 PM (cron format: minute hour day month weekday)
};

// Function to get the next Wednesday's date
function getNextWednesday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 3 = Wednesday
    
    // Calculate days until next Wednesday
    let daysUntilWednesday = 3 - dayOfWeek;
    if (daysUntilWednesday <= 0) {
        daysUntilWednesday += 7; // Get next week's Wednesday
    }
    
    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + daysUntilWednesday);
    
    // Format as "15 Oct Wed"
    const day = nextWednesday.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[nextWednesday.getMonth()];
    
    return `${day} ${month} Wed`;
}

// Function to send poll to the group
async function sendPoll() {
    try {
        console.log('\n🔍 Searching for group...');
        
        // Get all chats
        const chats = await client.getChats();
        
        // Find the specific group
        const targetGroup = chats.find(chat => 
            chat.isGroup && chat.name === CONFIG.groupName
        );
        
        if (!targetGroup) {
            console.error(`❌ Group "${CONFIG.groupName}" not found!`);
            console.log('\nAvailable groups:');
            chats.filter(chat => chat.isGroup).forEach(group => {
                console.log(`  - ${group.name}`);
            });
            return;
        }
        
        console.log(`✅ Found group: ${targetGroup.name}`);
        
        // Create poll question with next Wednesday's date
        const nextWedDate = getNextWednesday();
        const pollQuestion = `${nextWedDate} ${CONFIG.pollTime} ${CONFIG.pollLocation}`;
        const pollOptions = ['On', 'Off'];
        
        console.log(`📊 Creating poll: "${pollQuestion}"`);
        console.log(`   Options: ${pollOptions.join(', ')}`);
        
        // Send poll
        await targetGroup.sendPoll(pollQuestion, pollOptions, {
            allowMultipleAnswers: false
        });
        
        const timestamp = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Singapore',
            dateStyle: 'medium',
            timeStyle: 'short'
        });
        
        console.log(`✅ Poll sent successfully at ${timestamp}!\n`);
        
    } catch (error) {
        console.error('❌ Error sending poll:', error.message);
    }
}

// QR Code generation
client.on('qr', (qr) => {
    console.log('\n📱 Scan this QR code with WhatsApp on your phone:\n');
    qrcode.generate(qr, { small: true });
    console.log('\nOpen WhatsApp > Settings > Linked Devices > Link a Device');
});

// Client ready
client.on('ready', () => {
    console.log('\n✅ WhatsApp client is ready!');
    console.log(`📅 Poll will be sent every Saturday at 12:00 PM`);
    console.log(`📍 Target group: ${CONFIG.groupName}`);
    console.log(`⏰ Next scheduled run: ${getNextScheduledTime()}\n`);
    
    // Schedule the poll to be sent every Saturday at 12 PM
    cron.schedule(CONFIG.scheduleTime, () => {
        console.log('\n⏰ Scheduled time reached! Sending poll...');
        sendPoll();
    }, {
        timezone: "Asia/Singapore" // Adjust timezone as needed
    });
    
    console.log('Bot is running... Press Ctrl+C to stop.\n');
});

// Helper function to show next scheduled time
function getNextScheduledTime() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    
    let daysUntilSaturday = 6 - dayOfWeek;
    if (daysUntilSaturday < 0 || (daysUntilSaturday === 0 && currentHour >= 12)) {
        daysUntilSaturday += 7;
    }
    
    const nextRun = new Date(now);
    nextRun.setDate(now.getDate() + daysUntilSaturday);
    nextRun.setHours(12, 0, 0, 0);
    
    return nextRun.toLocaleString('en-US', {
        timeZone: 'Asia/Singapore',
        dateStyle: 'full',
        timeStyle: 'short'
    });
}

// Handle authentication
client.on('authenticated', () => {
    console.log('✅ Authentication successful!');
});

// Handle authentication failure
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

// Handle disconnection
client.on('disconnected', (reason) => {
    console.log('⚠️  Client was disconnected:', reason);
    console.log('Restarting...');
    client.initialize();
});

// Initialize the client
console.log('🚀 Starting WhatsApp Auto-Poll Bot...');
client.initialize();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down gracefully...');
    await client.destroy();
    process.exit(0);
});

