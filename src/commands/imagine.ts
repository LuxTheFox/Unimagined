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
      required: true,
    },
  ],
  cooldown: {},
  async execute({ client, interaction, args }) {
    try {
      const Prompt = args.getString("prompt", true);

      if (Prompt.length > 1024) {
        return await interaction.createMessage({
          embeds: [
            {
              title: `Invalid Prompt ${CustomEmojis.RedCross}`,
              description: "Prompt must be under 1024 characters long",
              color: 16106102,
            },
          ],
          flags: MessageFlags.EPHEMERAL,
        });
      }

      await interaction.createMessage({
        embeds: [
          {
            title: `Imagining the unimagined! ${CustomEmojis.SparklingStar}`,
            description: `Please wait...`,
            color: 16106102,
          },
        ],
        allowedMentions: {
          repliedUser: true,
        },
      });

      const ImageResponse = await openai.GenerateImage({
        prompt: Prompt,
        n: 1,
        size: "1024x1024",
        user: interaction.user.id,
      });

      const ImageURL = ImageResponse[0].Response.url;

      if (!ImageURL)
        return interaction.editOriginal({
          embeds: [
            {
              title: `Uh oh ${CustomEmojis.Warning}`,
              description: `We couldn't generate your image.\nPlease retry, sorry!`,
              color: 16106102,
            },
          ],
        });

      const message = await interaction.editOriginal({
        embeds: [
          {
            title: `Imagined the unimagined! ${CustomEmojis.SparklingStar}`,
            description: `Prompt: ${Prompt}`,
            image: {
              url: ImageURL,
            },
            color: 16106102,
          },
        ],
        components: [
          {
            type: ComponentTypes.ACTION_ROW,
            components: [
              {
                type: ComponentTypes.BUTTON,
                label: "Source",
                style: ButtonStyles.LINK,
                url: ImageURL,
              },
              {
                type: ComponentTypes.BUTTON,
                label: "Create variation?",
                customID: "create-variation",
                style: ButtonStyles.SECONDARY,
              },
            ],
          },
        ],
        allowedMentions: {
          repliedUser: true,
        },
      });

      const listener = new InteractionCollector(client, {
        message: message,
        interactionType: InteractionTypes.MESSAGE_COMPONENT,
        componentType: ComponentTypes.BUTTON,
        idle: 30_000, // 30 seconds
      });

      listener.once("collect", async (item) => {
        await item.createMessage({
          embeds: [
            {
              title: `Imagining a variation of the unimagined! ${CustomEmojis.SparklingStar}`,
              description: `Please wait...`,
              color: 16106102,
            },
          ],
          allowedMentions: {
            repliedUser: true,
          },
        });

        if (item.data.customID.toLowerCase() !== "create-variation") return;

        const image = await openai.GenerateVariation({
          image: (await openai.GetBufferFromURL(ImageURL)) as any,
          n: 1,
          size: "1024x1024",
          user: interaction.user.id,
        });

        const variationURL = image[0].Response.url;

        if (!variationURL) {
          return await item.editOriginal({
            embeds: [
              {
                title: `Uh oh ${CustomEmojis.Warning}`,
                description: `We couldn't generate your variation.\nPlease retry, sorry!`,
                color: 16106102,
              },
            ],
          });
        }

        await item.editOriginal({
          embeds: [
            {
              title: `Imagined a variation of the unimagined! ${CustomEmojis.SparklingStar}`,
              description: `Variation prompt: ${Prompt}`,
              image: {
                url: variationURL,
              },
              color: 16106102,
            },
          ],
          components: [
            {
              type: ComponentTypes.ACTION_ROW,
              components: [
                {
                  type: ComponentTypes.BUTTON,
                  label: "Source",
                  style: ButtonStyles.LINK,
                  url: variationURL,
                },
                {
                  type: ComponentTypes.BUTTON,
                  label: "Create another variation?",
                  customID: "create-variation",
                  style: ButtonStyles.SECONDARY,
                },
              ],
            },
          ],
          allowedMentions: {
            repliedUser: true,
          },
        });
      });
    } catch (error) {
      await interaction.deleteOriginal();
      await interaction.createFollowup({
        embeds: [
          {
            title: `Uh oh, an error occurred ${CustomEmojis.Warning}`,
            description: `${error}`,
            color: 16106102,
          },
        ],
        flags: MessageFlags.EPHEMERAL,
      });
    }
  },
});
