import dotenv from "dotenv";
import { z } from "zod";

import VanillaMinecraftClient from "./platforms/VanillaMinecraftClient";
import LocalConsole from "./platforms/Console";
import TelegramBot from "./platforms/TelegramBot";

dotenv.config();

const config = z.object({
    MINECRAFT_HOST_IP: z.string().regex(/^\b(?:\d{1,3}\.){3}\d{1,3}\b$/)
        .describe("Need a valid IPV4 ip address"),
    MINECRAFT_HOST_PORT: z.number({ coerce: true }).optional(),
    MINECRAFT_USERNAME: z.string(),
    MINECRAFT_AUTH: z.enum(['mojang', 'microsoft', 'offline', '']).optional()
        .transform((val) => (val === '' ? undefined : val)),
    MINECRAFT_PASSWORD: z.string().optional(),

    TELEGRAM_TOKEN: z.string(),
    TELEGRAM_CHAT_ID: z.string(),
}).safeParse(process.env);

if (config.success === false) {
    const errorText = config.error.issues.map((error) => `${error.path}: ${error.message}`).join("\n")
    console.error(`An error occurred during parsing the .env:\n${errorText}`);
    process.exit(1);
}

const platforms: Platform[] = [
    new VanillaMinecraftClient(
        config.data.MINECRAFT_HOST_IP,
        config.data.MINECRAFT_HOST_PORT,
        config.data.MINECRAFT_USERNAME,
        config.data.MINECRAFT_PASSWORD,
        config.data.MINECRAFT_AUTH
        ),
    new LocalConsole(),
    new TelegramBot(
        config.data.TELEGRAM_TOKEN,
        config.data.TELEGRAM_CHAT_ID,
        ),
];

// Register the message sender for every platform
for (const platform of platforms) {
    platform.registerReceiveCallback((message) => {
        platforms
            .filter(platform => platform.name != message.platformName)
            .forEach(platform => platform.send(message));
    });
}

// graceful stop
const stop = () => platforms.forEach(p => p.stop());

process.once('SIGINT', stop);
process.once('SIGTERM', stop);
