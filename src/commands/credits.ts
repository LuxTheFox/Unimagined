import { ApplicationCommandTypes } from "oceanic.js";
import { Command } from "../Structs/Command";

let ghLink1 = "https://github.com/ThatGuyJamal";
let ghLink2 = "https://github.com/LuxTheFox";

export default new Command({
  type: ApplicationCommandTypes.CHAT_INPUT,
  category: "Information",
  name: "credits",
  description: "Bot credits",
  usage: "/credits",
  cooldown: {
    user: 10,
    guild: 5,
  },
  async execute({ interaction }) {
    await interaction.createMessage({
      embeds: [
        {
          description: `Unimagined is a bot created by [ThatGuyJamal](${ghLink1}) & [Lux](${ghLink2}).\n\nThe bot allows users to generate AI generated images, and also allows users to generate images using a neural network. It is free to use to anyone on discord.`,
          color: 16106102,
          thumbnail: {
            url: interaction.guild?.iconURL() ?? "https://discord.com/assets/1cbd08c76f8af6dddce02c5138971129.png" 
          },
          timestamp: new Date().toISOString(),          
        },
      ],
    });
  },
});
