import { ApplicationCommandTypes, MessageFlags } from 'oceanic.js';
import { Command } from "../Structs/Command";

export default new Command({
    type: ApplicationCommandTypes.CHAT_INPUT,
    category: 'Utility',
    name: 'ping',
    description: 'Get the bots ping',
    usage: '/ping',
    execute({ interaction }) {
        interaction.createMessage({
            embeds: [{
                title: 'Pong!',
            }],
            flags: MessageFlags.EPHEMERAL
        });
    }
});