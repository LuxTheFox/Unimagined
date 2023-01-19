//JAMAL
//Please note I want to rewrite this commands entire code, since I feel like it is messy and that I could rewrite it way cleaner

import {
	ApplicationCommandOptionTypes,
	ApplicationCommandTypes,
	ButtonStyles,
	Client,
	ComponentInteraction,
	ComponentTypes,
	InteractionTypes,
	MessageFlags
} from "oceanic.js";
import { InteractionCollector } from 'oceanic-collectors'
import { Command } from "../Structs/Command";
import { openai } from "../OpenAPIWrapper";
import { CustomEmojis } from "../Emojis";

export default new Command({
	name: "imagine",
	description: "Imagine the impossible",
	type: ApplicationCommandTypes.CHAT_INPUT,
	category: "Generate",
	usage: "/imagine <prompt>",
	options: [
        {
            name: "prompt",
            description: "The prompt to generate an image from",
            type: ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ],
	async execute({ client, interaction, args }) {
		try {
			const Prompt = args.getString("prompt", true);

			if (Prompt.length > 1024)
				return interaction.createMessage({
					embeds: [{
						title: `Invalid Prompt ${CustomEmojis.RedCross}`,
						description: 'Prompt must be under 1024 characters long',
						color: 16106102
					}],
					flags: MessageFlags.EPHEMERAL
				})
			
			await interaction.createMessage({
				embeds: [{
					title: `Imagining the unimagined! ${CustomEmojis.SparklingStar}`,
					description: `Please wait...`,
					color: 16106102
				}],
				allowedMentions: {
					repliedUser: true
				}
			});

			const ImageReponse = await openai.GenerateImage({
				prompt: Prompt,
				n: 1,
				size: "1024x1024",
				user: interaction.user.id
			}); //Using the custom wrapper I made ^
			const ImageURL = ImageReponse[0].Response.url;

			if (!ImageURL)
				return interaction.editOriginal({
					embeds: [{
						title: `Uh oh ${CustomEmojis.Warning}`,
						description: `We couldnt generate your image.\nPlease retry, sorry!`,
						color: 16106102
					}]
				});

			const message = await interaction.editOriginal({
				embeds: [{
					title: `Imagined the unimagined! ${CustomEmojis.SparklingStar}`,
					description: `Prompt: ${Prompt}`,
					image: {
						url: ImageURL
					},
					color: 16106102
				}],
				components: [{
					type: ComponentTypes.ACTION_ROW,
					components: [{
						type: ComponentTypes.BUTTON,
						label: 'Source',
						style: ButtonStyles.LINK,
						url: ImageURL
					}, {
						type: ComponentTypes.BUTTON,
						label: 'Create variation?',
						customID: 'createvariation',
						style: ButtonStyles.SECONDARY,
					}]
				}],
				allowedMentions: {
					repliedUser: true
				}
			});

			const listener = new InteractionCollector(client, {
				message: message,
				interactionType: InteractionTypes.MESSAGE_COMPONENT,
				componentType: ComponentTypes.BUTTON,
				idle: 30000
			}); //Creating listener for the variation button

			/*
			Notes about this function

			Its used as a recursive function so it calls itself inside itself
			I made it this way so you could create variations of variations of variations... ect ect

			Notes about rewrite
			On the rewrite a big idea I have for this function is to rewrite it in a way where it can be used to create the first image and all variations as such...
			halving the code size resulting in much cleaner code and easier to understand
			*/
			async function createVariation(client: Client, buttonInteraction: ComponentInteraction<ComponentTypes.BUTTON>, ImageURL: string) {
				await buttonInteraction.createMessage({
					embeds: [{
						title: `Imagining a variation of the unimagined! ${CustomEmojis.SparklingStar}`,
						description: `Please wait...`,
						color: 16106102
					}],
					allowedMentions: {
						repliedUser: true
					}
				});

				if (buttonInteraction.data.customID.toLowerCase() !== "createvariation") return;
				const image = await openai.GenerateVariation({
					image: await openai.GetBufferFromURL(ImageURL) as any,
					n: 1,
					size: '1024x1024',
					user: interaction.user.id
				});

				const variationURL = image[0].Response.url;

				if (!variationURL)
					return buttonInteraction.editOriginal({
						embeds: [{
							title: `Uh oh ${CustomEmojis.Warning}`,
							description: `We couldnt generate your variation.\nPlease retry, sorry!`,
							color: 16106102
						}]
					});

				const variationMessage = await buttonInteraction.editOriginal({
					embeds: [{
						title: `Variated the unimagined! ${CustomEmojis.SparklingStar}`,
						description: `Variation prompt: ${Prompt}`,
						image: {
							url: variationURL
						},
						color: 16106102
					}],
					components: [{
						type: ComponentTypes.ACTION_ROW,
						components: [{
							type: ComponentTypes.BUTTON,
							label: 'Source',
							style: ButtonStyles.LINK,
							url: variationURL
						}, {
							type: ComponentTypes.BUTTON,
							label: 'Create another variation?',
							customID: 'createvariation',
							style: ButtonStyles.SECONDARY,
						}]
					}],
					allowedMentions: {
						repliedUser: true
					}
				});

				const variationListener = new InteractionCollector(client, {
					message: variationMessage,
					interactionType: InteractionTypes.MESSAGE_COMPONENT,
					componentType: ComponentTypes.BUTTON,
					idle: 30000
				}); //same reason as the other listener

				variationListener.on('collect', (buttonInteraction) => {
					createVariation(client, buttonInteraction, ImageURL);
				}); //same reason as the other collection (heres the recursive usage aswell)

				variationListener.once('end', () => {
					buttonInteraction.editOriginal({
						components: [{
							type: ComponentTypes.ACTION_ROW,
							components: [{
								type: ComponentTypes.BUTTON,
								label: 'Source',
								style: ButtonStyles.LINK,
								url: ImageURL
							}]
						}]
					});
				}); //same reason as the other end
			};

			listener.on('collect', async (buttonInteraction) => {
				createVariation(client, buttonInteraction, ImageURL);
			}); //Used for when a button is pressed to call creating a variation

			listener.once('end', () => {
				interaction.editOriginal({
					components: [{
						type: ComponentTypes.ACTION_ROW,
						components: [{
							type: ComponentTypes.BUTTON,
							label: 'Source',
							style: ButtonStyles.LINK,
							url: ImageURL
						}]
					}]
				});
			}); //used when the listener is idle for 30 seconds resulting in it ending and removing the option to create variations
		} catch (error) {
			await interaction.deleteOriginal();
			await interaction.createFollowup({
				embeds: [{
					title: `Uh oh, an error occured ${CustomEmojis.Warning}`,
					description: `${error}`,
					color: 16106102
				}],
				flags: MessageFlags.EPHEMERAL
			});
		};
	},
});
