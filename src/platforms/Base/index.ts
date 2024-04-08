type Message = {
    platformName: string,
    username: string | undefined,
    text: string,
}

type ReceiveMessageCallback = (message: Message) => void;

interface Platform {
    name: string;
    send(message: Message): void;
    registerReceiveCallback(callback: ReceiveMessageCallback): void;
    stop(): void;
}
