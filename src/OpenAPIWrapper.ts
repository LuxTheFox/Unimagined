import {
  Configuration,
  CreateImageRequest,
  ImagesResponseDataInner,
  OpenAIApi,
} from "openai";
import { AxiosRequestConfig } from "axios";
import { randomUUID } from "crypto";
import config from "./config.json";
import fs from "fs";

const configuration = new Configuration({
  apiKey: config["openai_key"],
}); //Don't add organization without inviting me since I get error 401 Unauthorized

/**
 * @see https://beta.openai.com/docs/api-reference/images
 */
class OpenAPIWrapper {
	private openAI: OpenAIApi;
	private Images = new Map();
	public constructor(configuration: Configuration) {
		this.openAI = new OpenAIApi(configuration);
	}

	private SetImage(UUID: string, ImageURL: string) {
		this.Images.set(UUID, ImageURL);
	}

	public GetImage(UUID: string) {
		return this.Images.get(UUID);
	}

	public async GetBufferFromURL(URL: string) {
		const ArrayBuffer = await (await fetch(URL)).arrayBuffer();
		const ConvertedBuffer: Buffer = Buffer.from(ArrayBuffer);
		const FinalBuffer: any = ConvertedBuffer;
		FinalBuffer.name = "image.png";
		console.log(FinalBuffer);
		return FinalBuffer;
	}

	public async GenerateImage(
		OpenAIOptions: CreateImageRequest,
		AxiosOptions?: AxiosRequestConfig
	) {
		const Images = await this.openAI.createImage(
			{
				...OpenAIOptions,
				response_format: "url",
			},
			AxiosOptions
		);

		const result: { UUID: string; Response: ImagesResponseDataInner }[] = [];
		Images.data.data.forEach((Image) => {
			const UUID = randomUUID();
			this.SetImage(UUID, Image.url as string);
			result.push({
				UUID: UUID,
				Response: Image,
			});
		});
		return result;
	}
	/*
	async GenerateEdit(EditOptions: {
		image: File, 
		mask: File, 
		prompt: string, 
		n?: number, 
		size?: string, 
		user?: string, 
		options?: AxiosRequestConfig
	}) {
		return await this.openAI.createImageEdit(EditOptions.image,
			EditOptions.mask,
			EditOptions.prompt,
			EditOptions.n,
			EditOptions.size,
			"url",9
			EditOptions.user,
			EditOptions.options);
	};
	Keep this commented out unless we decide to add image masking features*/

	public async GenerateVariation(VariationOptions: {
		image: File;
		n?: number;
		size?: string;
		user?: string;
		options?: AxiosRequestConfig;
	}) {
		const variations = await this.openAI.createImageVariation(
			VariationOptions.image,
			VariationOptions.n,
			VariationOptions.size,
			"url",
			VariationOptions.user,
			VariationOptions.options
		);

		const result: { UUID: string; Response: ImagesResponseDataInner }[] = [];
		variations.data.data.forEach((variation) => {
			const UUID = randomUUID();
			this.SetImage(UUID, variation.url as string);
			result.push({
				UUID: UUID,
				Response: variation,
			});
		});

		return result;
	}
}

export const openai = new OpenAPIWrapper(configuration);
