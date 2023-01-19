import { ExtendedClient } from "./Structs/ExtendedClient";
import Config from "./config.json";

const devGuild = Config["devGuild"];

const client = new ExtendedClient({
  auth: `Bot ${Config["token"]}`,
  Developers: ["987799034611761222", "370637638820036608"],
  gateway: {
    intents: 4609,
  },
});

client.on("ready", async () => {
  console.log(`[✔️]: Online as ${client.user.tag}`);
  await client.LoadCommands("commands", devGuild);
});

client.on("error", (err) => {
  console.error(`Error occurred.`, err);
});

client.on("interactionCreate", async (interaction) => {
  await client.HandleCommands(interaction);
});

client.connect();
