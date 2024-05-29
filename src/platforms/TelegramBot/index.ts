import { Telegraf } from "telegraf";
import { message } from "telegraf/filters"

export default class TelegramBot extends Telegraf implements Platform {
    name = "TG";

    private callbacks: ReceiveMessageCallback[] = [];

    private chatId: string;

    async send(message: Message) {
        await this.telegram.sendMessage(
            this.chatId,
            `[${message.platformName}] ${message.username !== undefined && `${message.username}: ` || ""}${message.text}`
            );
    }

    registerReceiveCallback(callback: ReceiveMessageCallback) {
        this.callbacks.push(callback);
    }

    stop() {
        super.stop('Stopped');
        console.log("Telegram stopped");
    }

    constructor(token: string, chatId: string) {
        super(token);
        
        this.chatId = chatId;
        
        this.on(message('text'), async (ctx) => {
            if (ctx.message.chat.id.toString() != this.chatId)
                return await this.telegram.sendMessage(this.chatId, "Wrong chat");
                        
            const last_name = ctx.message.from.last_name;
            for (let callback of this.callbacks) callback({
                platformName: this.name,
                username: ctx.message.from.first_name + (last_name ? ` ${last_name}` : ""),
                text: ctx.message.text,
            })
        });

        this.launch(() => console.log("Telegram connected"));
    }
}
