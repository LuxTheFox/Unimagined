import { Client, CreateApplicationCommandOptions, CommandInteraction, InteractionOptionsWrapper, PermissionName } from 'oceanic.js';

interface ExecuteOptions {
    client: Client,
    interaction: CommandInteraction,
    args: InteractionOptionsWrapper
};
type ExecuteFunction = (options: ExecuteOptions) => unknown;
export type ICommand = {
    category: string;
    name: string;
    description: string;
    usage: string;
    requiredPermissions?: (PermissionName | bigint)[];

    execute: ExecuteFunction
} & CreateApplicationCommandOptions;

export class Command {
    constructor(options: ICommand) {
        Object.assign(this, options);
    }
};