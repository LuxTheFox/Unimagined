import {
	AnyInteractionGateway,
	Client,
	ClientOptions,
	Collection,
	InteractionTypes,
	MessageFlags,
} from "oceanic.js";
import { CustomEmojis } from "../Emojis";
import { ICommand, ICoolDown } from "./Command";
import path from "path";
import fs from "fs";

type ExtendedClientOptions = {
	Developers: string[];
} & ClientOptions;

export class ExtendedClient extends Client {
	public cooldowns: ICoolDown = {
		user: new Collection(),
		guild: new Collection(),
		global: new Collection(),
	};
	public commands = new Collection<string, ICommand>();
	public Developers: string[] = [];

	public constructor(Options: ExtendedClientOptions) {
		super(Options);
		this.Developers = Options.Developers;
	}

	/**
	 *
	 * @param CommandPath
	 * @param DevGuild
	 */
	public async LoadCommands(CommandPath: string, DevGuild?: string) {
		if (!path.isAbsolute(CommandPath))
			CommandPath = path.join(__dirname, "..", CommandPath);
		const Files = fs.readdirSync(CommandPath).filter((i) => i.endsWith(".js"));
		for (const file of Files) {
			if (fs.lstatSync(path.join(CommandPath, file)).isDirectory()) {
				const SubFiles = fs.readdirSync(path.join(CommandPath, file));
				for (const subFile of SubFiles) {
					const ImportedSubCommand: ICommand = (
						await import(path.join(CommandPath, file, subFile))
					).default;
					this.commands.set(ImportedSubCommand.name, ImportedSubCommand);
					console.log(`[✔️] - Loaded Command: ${ImportedSubCommand.name}`);
				}
			} else {
				const ImportedCommand: ICommand = (
					await import(path.join(CommandPath, file))
				).default;
				this.commands.set(ImportedCommand.name, ImportedCommand);
				console.log(`[✔️] - Loaded Command: ${ImportedCommand.name}`);
			}
		}

		DevGuild
			? this.application.bulkEditGuildCommands(
					DevGuild,
					Array.from(this.commands.values())
			  )
			: this.application.bulkEditGlobalCommands(
					Array.from(this.commands.values())
			  );
		console.log(`[✔️] - Uploaded Commands!`);
	}

	/**
	 * Handles bot interactions, buttons, and more
	 * @param i Any interaction accepted from the discord gateway
	 * @returns
	 */
	public async HandleCommands(i: AnyInteractionGateway) {
		if (i.type !== InteractionTypes.APPLICATION_COMMAND) return;

		const cmd = this.commands.get(i.data.name);
		if (!cmd) return;

		if (
			cmd.requiredUserPermissions &&
			!cmd.requiredUserPermissions.every((x) => i.memberPermissions?.has(x))
		) {
			return await i.createMessage({
				embeds: [
					{
						title: `Permission Error ${CustomEmojis.RedCross}`,
						description: "You are unauthorized to run this command!",
						color: 16106102,
					},
				],
				flags: MessageFlags.EPHEMERAL,
			});
		}

		if (cmd.cooldown) {
			if (
				cmd.cooldown.global &&
				(this.cooldowns.global.get(i.data.name) ?? 0) > Date.now()
			)
				return await i.createMessage({
					embeds: [
						{
							title: `Cooldown Error ${CustomEmojis.Warning}`,
							description: `This command is on cooldown for ${
								((this.cooldowns.user.get(i.user.id) ?? 0) - Date.now()) / 1000
							} more seconds`,
							color: 16106102,
						},
					],
					flags: MessageFlags.EPHEMERAL,
				});

			if (
				cmd.cooldown.guild &&
				(this.cooldowns.guild.get(i.guild?.id ?? "") ?? 0) > Date.now()
			)
				return await i.createMessage({
					embeds: [
						{
							title: `Cooldown Error ${CustomEmojis.Warning}`,
							description: `This guild is on cooldown for ${
								((this.cooldowns.user.get(i.user.id) ?? 0) - Date.now()) / 1000
							} more seconds`,
							color: 16106102,
						},
					],
					flags: MessageFlags.EPHEMERAL,
				});

			if (
				cmd.cooldown.user &&
				(this.cooldowns.user.get(i.user.id) ?? 0) > Date.now()
			)
				return await i.createMessage({
					embeds: [
						{
							title: `Cooldown Error ${CustomEmojis.Warning}`,
							description: `You are on cooldown for ${
								((this.cooldowns.user.get(i.user.id) ?? 0) - Date.now()) / 1000
							} more seconds`,
							color: 16106102,
						},
					],
					flags: MessageFlags.EPHEMERAL,
				});
		}

		if (cmd.cooldown?.user) {
			this.cooldowns.user.set(i.user.id, Date.now() + cmd.cooldown.user * 1000);
		}
		if (cmd.cooldown?.guild) {
			this.cooldowns.guild.set(
				i.guild?.id ?? "",
				Date.now() + cmd.cooldown.guild * 1000
			);
		}

		if (cmd.cooldown?.global) {
			this.cooldowns.user.set(
				i.data.name,
				Date.now() + cmd.cooldown.global * 1000
			);
		}
		cmd.execute({
			client: this,
			interaction: i,
			args: i.data.options,
		});
	}
}
