import { ApplicationCommandTypes, MessageFlags } from "oceanic.js";
import { Command } from "../Structs/Command";

export default new Command({
  type: ApplicationCommandTypes.CHAT_INPUT,
  category: "Utility",
  name: "ping",
  description: "Get the bots ping",
  usage: "/ping",
  cooldown: {
    user: 8,
    guild: 5,
    global: 3
  },
  async execute({ interaction }) {
    await interaction.defer(MessageFlags.LOADING + MessageFlags.EPHEMERAL);

    const defer = await interaction.getOriginal();

    await interaction.editOriginal({
      embeds: [
        {
          title: `Latency: ${
            defer.createdAt.getTime() - interaction.createdAt.getTime()
          }ms`,
          color: 16106102,
        },
      ],
      flags: MessageFlags.EPHEMERAL,
    });
  },
});
