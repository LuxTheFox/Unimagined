//JAMAL
//Please note I want to rewrite this commands entire code, since I feel like it is messy and that I could rewrite it way cleaner

import {
	ApplicationCommandOptionTypes,
	ApplicationCommandTypes,
	ButtonStyles,
	CommandInteraction,
	ComponentInteraction,
	ComponentTypes,
	InteractionTypes,
	MessageFlags,
} from "oceanic.js";
import { InteractionCollector } from 'oceanic-collectors'
import { Command } from "../Structs/Command";
import { openai } from "../OpenAPIWrapper";
import { CustomEmojis } from "../Emojis";
import { ExtendedClient } from "../Structs/ExtendedClient";
import { CreateImageRequest } from "openai";


async function GenerateImage(client: ExtendedClient, Prompt: string, interaction: CommandInteraction|ComponentInteraction, Variation?: string) {
  try {
    await interaction.createMessage({
      embeds: [{
        title: `${(Variation)?'Variating':'Imagining'} the unimagined! ${CustomEmojis.SparklingStar}`,
        description: 'Please wait for your image...',
        color: 16106102
      }]
    });
    
    const imageOptions: CreateImageRequest = {
      prompt: Prompt,
      n: 1,
      size: "1024x1024",
      response_format: 'url',
      user: interaction.user.id
    };
    const image = (Variation)
      ? await openai.GenerateVariation({ image: await openai.GetBufferFromURL(Variation) as any, ...imageOptions as any })
      : await openai.GenerateImage({ ...imageOptions });
    const imageURL = (image)?image[0].Response.url:null;

    if (!image || !imageURL) 
      return interaction.editOriginal({
        embeds: [{
          title: 'Failed to generate image',
          description: 'We failed to generated your image, sorry please retry',
          color: 16106102
        }]
      });

    const message = await interaction.editOriginal({
      embeds: [{
        title: `${(Variation)?'Variated':'Imagined'} the unimagined! ${CustomEmojis.SparklingStar}`,
        description: `Given prompt: ${Prompt}`,
        image: {
          url: imageURL
        },
        color: 16106102
      }],
      components: [{
        type: ComponentTypes.ACTION_ROW,
        components: [{
          type: ComponentTypes.BUTTON,
          style: ButtonStyles.LINK,
          label: 'Source',
          url: imageURL
        }, {
          type: ComponentTypes.BUTTON,
          style: ButtonStyles.SECONDARY,
          customID: 'Variation',
          label: 'Create variation?'
        }]
      }]
    });

    const collector = new InteractionCollector(client, {
      message: message,
      interactionType: InteractionTypes.MESSAGE_COMPONENT,
      componentType: ComponentTypes.BUTTON,
      idle: 30000
    });
    collector.on('collect', (i) => GenerateImage(client, Prompt, i, imageURL));
    collector.on('end', (i) => {
      interaction.editOriginal({
        components: [{
          type: ComponentTypes.ACTION_ROW,
          components: [{
            type: ComponentTypes.BUTTON,
            style: ButtonStyles.LINK,
            label: 'Source',
            url: imageURL
          }]
        }]
      });
    });
  } catch(err) {
    interaction.editOriginal({
      embeds: [{
        title: `There was an error ${CustomEmojis.RedCross}`,
        description:`${err}`,
        color: 16106102
      }]
    })
  }
};

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
      maxLength: 1024
    },
  ],
  cooldown: {
    user: 10,
  },
  async execute({ client, interaction, args }) {
    GenerateImage(client, args.getString("prompt", true), interaction);
  }
});