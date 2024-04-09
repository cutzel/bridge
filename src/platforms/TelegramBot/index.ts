import { Telegraf } from "telegraf";
import { message } from "telegraf/filters"

export default class TelegramBot implements Platform {
    name = "TG";

    private callbacks: ReceiveMessageCallback[] = [];

    private bot: Telegraf;
    private chatId: string;

    async send(message: Message) {
        await this.bot.telegram.sendMessage(
            this.chatId,
            `[${message.platformName}] ${message.username !== undefined && `${message.username}: ` || ""}${message.text}`
            );
    }

    registerReceiveCallback(callback: ReceiveMessageCallback) {
        this.callbacks.push(callback);
    }

    stop() {
        this.bot.stop('Stopped');
        console.log("Telegram stopped");
    }

    constructor(token: string, chatId: string) {
        this.chatId = chatId;

        this.bot = new Telegraf(token);

        this.bot.on(message('text'), async (ctx) => {
            if (ctx.message.chat.id.toString() != this.chatId)
                return await this.bot.telegram.sendMessage(this.chatId, "Wrong chat");
                        
            const last_name = ctx.message.from.last_name;
            for (let callback of this.callbacks) callback({
                platformName: this.name,
                username: ctx.message.from.first_name + (last_name ? ` ${last_name}` : ""),
                text: ctx.message.text,
            })
        });

        this.bot.launch(() => console.log("Telegram connected"));
    }
}
