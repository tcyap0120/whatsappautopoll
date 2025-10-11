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

// Function to send poll to the group with retry logic
async function sendPoll(retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds
    
    try {
        console.log('\n🔍 Searching for group...');
        
        // Get all chats with timeout
        const chatsPromise = client.getChats();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout getting chats')), 30000)
        );
        
        const chats = await Promise.race([chatsPromise, timeoutPromise]);
        
        console.log(`📋 Found ${chats.length} chats total`);
        
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
        
        // Send poll with timeout
        const sendPromise = targetGroup.sendPoll(pollQuestion, pollOptions, {
            allowMultipleAnswers: false
        });
        const sendTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout sending poll')), 20000)
        );
        
        await Promise.race([sendPromise, sendTimeoutPromise]);
        
        const timestamp = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Singapore',
            dateStyle: 'medium',
            timeStyle: 'short'
        });
        
        console.log(`✅ Poll sent successfully at ${timestamp}!\n`);
        
    } catch (error) {
        console.error(`❌ Error sending poll (attempt ${retryCount + 1}/${maxRetries + 1}):`, error.message);
        
        // Retry logic
        if (retryCount < maxRetries) {
            console.log(`⏳ Retrying in ${retryDelay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return sendPoll(retryCount + 1);
        } else {
            console.error('❌ Max retries reached. Poll not sent.');
            console.error('💡 Tip: Check if WhatsApp is still connected on your phone.');
        }
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
    
    // TEST: Send poll immediately on startup
    console.log('\n🧪 Running test poll in 10 seconds...');
    setTimeout(() => {
        console.log('\n🧪 TEST MODE: Sending poll now...');
        sendPoll();
    }, 10000);
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

