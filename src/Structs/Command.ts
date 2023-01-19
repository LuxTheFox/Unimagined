import {
  CreateApplicationCommandOptions,
  CommandInteraction,
  InteractionOptionsWrapper,
  PermissionName,
  Collection,
} from "oceanic.js";
import { ExtendedClient } from "./ExtendedClient";

interface ExecuteOptions {
  client: ExtendedClient;
  interaction: CommandInteraction;
  args: InteractionOptionsWrapper;
}

type ExecuteFunction = (options: ExecuteOptions) => unknown;

export interface ICoolDown {
  user: Collection<string, number>;
  guild: Collection<string, number>;
  global: Collection<string, number>;
}

type ICommandCooldowns = {
  user?: number;
  guild?: number;
  global?: number;
};

export type ICommand = {
  category: string;
  name: string;
  description: string;
  usage: string;
  requiredUserPermissions?: (PermissionName | bigint)[];
  cooldown?: ICommandCooldowns;
  execute: ExecuteFunction;
} & CreateApplicationCommandOptions;

export class Command {
  constructor(options: ICommand) {
    Object.assign(this, options);
  }
}
