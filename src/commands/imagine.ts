import {
	ApplicationCommandOptionTypes,
	ApplicationCommandTypes,
	MessageFlags,
} from "oceanic.js";
import { openai } from "../api";
import { Command } from "../Structs/Command";

export default new Command({
	name: "imagine",
	description: "Imagine the impossible",
	type: ApplicationCommandTypes.CHAT_INPUT,
	category: "Generate",
	usage: "/imagine <text>",
	options: [
        {
            name: "text",
            description: "Text to generate an image from",
            type: ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ],
	async execute({ interaction, args }) {
		await interaction.defer();

		try {
			await interaction.createFollowup({
				content: `Generating imagine...`,
				allowedMentions: {
					repliedUser: true,
				},
			});

			let text = args.getString("text", true);

			if(text.length > 1024) return interaction.editOriginal({
				content: `Text must be less than 1024 characters`,
				allowedMentions: {
					repliedUser: true,
				},
			});

			const response = await openai.createImage({
				prompt: text,
				n: 1,
				size: "1024x1024",
				response_format: "url",
			});

			let image_url = response.data.data[0].url ?? "";

			await interaction.editOriginal({
				content: `Imagine the impossible`,
				embeds: [
					{
						image: {
							url: image_url,
						},
					},
				],
				allowedMentions: {
					repliedUser: true
				}
			});
		} catch (error) {
			await interaction.editOriginal({
				content: `${error}`,
			});
		}
	},
});
