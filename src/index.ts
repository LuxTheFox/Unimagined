import { Client, InteractionTypes, MessageFlags } from "oceanic.js";
import { ICommand } from "./Structs/Command";
import Config from "./config.json";
import path from "path"; //Path for crossplatform hosting support
import fs from "fs";

const devGuild = Config["devGuild"];

const client = new Client({
  auth: `Bot ${Config["token"]}`,
  gateway: {
    intents: 4609,
  },
});

client.on("ready", async () => {
  console.log(`[✔️]: Online as ${client.user.tag}`);

  const commands: ICommand[] = [];
  const CommandFiles = fs.readdirSync(path.join(__dirname, "commands"));

  for (let i = 0; i < CommandFiles.length; i++) {
    //for runs async, foreach runs sync (at least I have had sync/async issues been fixed by changing foreach to for)
    const Command: ICommand = (
      await import(path.join(__dirname, "commands", CommandFiles[i]))
    ).default;

    commands.push(Command);
  }

  if (Config.createCommands) {
    devGuild.length !== 0
      ? client.application.bulkEditGuildCommands(devGuild, commands)
      : client.application.bulkEditGlobalCommands(commands);

    console.log(`[✔️]: Commands created`);
  }

  client.on("interactionCreate", (interaction) => {
    if (interaction.type !== InteractionTypes.APPLICATION_COMMAND) return;

    const command: ICommand = commands.filter(
      (i) => i.name === interaction.data.name
    )[0];

    if (
      command.requiredPermissions &&
      !command.requiredPermissions.every((i) =>
        interaction.memberPermissions?.has(i)
      )
    )
      return interaction.createFollowup({
        embeds: [
          {
            title: "Permission Denied",
            description: "You do not have permission to run this command",
          },
        ],
        flags: MessageFlags.EPHEMERAL,
      });

    command.execute({
      client: client,
      interaction: interaction,
      args: interaction.data.options,
    });
  });
});

client.on("error", (err) => {
  console.error(`Error occurred.`, err);
});

client.connect();
