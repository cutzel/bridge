export default class Console implements Platform {
    name = "TERM";
    
    private spamNumbers = false;

    private callbacks: ReceiveMessageCallback[] = [];

    send(message: Message) {
        console.log(`[${message.platformName}] ${message.username}: ${message.text}`)
    }

    registerReceiveCallback(callback: ReceiveMessageCallback) {
        this.callbacks.push(callback);
    }

    stop() {}

    sendMessageToCallbacks(message: Message) {
        for (let callback of this.callbacks) callback(message);
    }

    generateRandomNumber(length: number) {
        let randomNumber = '';
        for (let i = 0; i < length; i++) {
          randomNumber += Math.floor(Math.random() * 10);
        }
        return randomNumber;
    }

    constructor() {
        if (this.spamNumbers)
            setInterval(() => {
                this.callbacks.forEach(callback => callback({
                    platformName: this.name,
                    username: undefined,
                    text: this.generateRandomNumber(10),
                }));
            }, 5 * 1000);
    }
}