import { Bot, BotOptions, createBot } from "mineflayer";

// A minecraft check will kick the bot if illegal characters are sent
function safeText(text: String) {
    return text.split('')
    .filter(char => char.charCodeAt(0) !== 167 && char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127)
    .join('');
}

function splitTextIntoChunks(text: string, chunkSize: number) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

export default class VanillaMinecraftClient implements Platform {
    name = "MC";

    private botOptions: BotOptions;
    private client: Bot;

    private reconnectInterval: NodeJS.Timeout | undefined;
    
    private callbacks: ReceiveMessageCallback[] = [];

    send(message: Message) {
        const msg = `[${message.platformName}] ${message.username !== undefined && `${safeText(message.username)}: ` || ""}${safeText(message.text)}`;

        const msgArray = splitTextIntoChunks(msg, this.client.supportFeature('lessCharsInChat') ? 100 : 256)
        const filteredMsgArray = msgArray.map(messagePart => {
            if (messagePart[0] == "/")
                return "∕" + messagePart.slice(1)
            else
                return messagePart
        })

        if (this.client._client.state == 'play')
            this.client.chat(filteredMsgArray.join(""))
    }

    registerReceiveCallback(callback: ReceiveMessageCallback) {
        this.callbacks.push(callback);
    }

    stop() {
        this.client.end("Stopped");
        console.log("Minecraft stopped");
    }

    registerEvents() {        
        this.client.on('spawn', () => {
            if (this.reconnectInterval) {
                console.log("Minecraft reconnected");
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = undefined;
            } else {
                console.log("Minecraft connected");
            }
        });

        this.client.on('chat', (name, message) => {
            if (name != this.client._client.username)
                for (let callback of this.callbacks) callback({
                        platformName: this.name,
                        username: name,
                        text: message,
                    });
        });

        // reconnect if disconnected
        this.client.on('end', (reason) => {
            if (reason == "Stopped") return;

            console.warn(`Minecraft client ended: ${reason}`)
            if (this.reconnectInterval === undefined)
                this.reconnectInterval = setInterval(() => {
                    this.client = createBot(this.botOptions);
                    this.registerEvents()
                }, 60 * 1000); // every minute
        });
    }

    constructor(hostIp: string, hostPort: number | undefined, username: string, password: string | undefined, auth: 'mojang' | 'microsoft' | 'offline' | undefined) {
        this.botOptions = {
            username: username,
            host: hostIp,
            port: hostPort,
            password: password,
            auth: auth,
        };

        this.client = createBot(this.botOptions);
        this.registerEvents();
    }
}
