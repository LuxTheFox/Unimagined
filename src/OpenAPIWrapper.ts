import {
	Configuration,
	CreateImageRequest,
	ImagesResponseDataInner,
	OpenAIApi,
} from "openai";
import { AxiosRequestConfig } from "axios";
import { randomUUID } from "node:crypto";
import config from "./config.json";

const configuration = new Configuration({
	apiKey: config["openai_key"],
}); //Don't add organization without inviting me since I get error 401 Unauthorized

interface ImageBuffer extends Buffer {
	name: string;
}

/** The results sent to the api buffer */
interface ImageResult {
	UUID: string;
	Response: ImagesResponseDataInner;
  
}
interface ImageBuffer extends Buffer {
  name: string;
}

/** The results sent to the api buffer */
interface ImageResult {
  UUID: string;
  Response: ImagesResponseDataInner;
}

/**
 * The OpenAI Wrapper class
 * @class
 * @see https://beta.openai.com/docs/api-reference/images
 */
class OpenAPIWrapper {
	private openAI: OpenAIApi;
	private Images = new Map<string, string>();
	public constructor(configuration: Configuration) {
		this.openAI = new OpenAIApi(configuration);
	}

	/**
	 * Adds an image to the images cache
	 * @param UUID The unique identifier for the image
	 * @param ImageURL The URL of the image
	 */
	private SetImage(UUID: string, ImageURL: string) {
		this.Images.set(UUID, ImageURL);
	}

	/**
	 * Gets an image from the images cache
	 * @param UUID The unique identifier for the image
	 * @returns
	 */
	public GetImage(UUID: string): string | null {
		return this.Images.get(UUID) || null;
	}

	/**
	 * Creates a buffer from a URL
	 * @param URL The URL of the image
	 * @returns
	 */
	public async GetBufferFromURL(URL: string): Promise<ImageBuffer> {
		const ArrayBuffer = await (await fetch(URL)).arrayBuffer();
		const ConvertedBuffer = Buffer.from(ArrayBuffer) as ImageBuffer;
		const FinalBuffer = ConvertedBuffer;
		FinalBuffer.name = "image.png";
		return FinalBuffer;
	}

	/**
	 * Creates an image from the OpenAI API
	 * @param OpenAIOptions
	 * @param AxiosOptions
	 * @returns
	 */
	public async GenerateImage(
		OpenAIOptions: CreateImageRequest,
		AxiosOptions?: AxiosRequestConfig
	): Promise<ImageResult[]> {
		const Images = await this.openAI
			.createImage(
				{
					...OpenAIOptions,
					response_format: "url",
				},
				AxiosOptions
			)
			.catch((err) => {
				console.error(err);
				return null;
			});

		if (!Images) return [];

		const result: ImageResult[] = [];

		for (const Image of Images.data.data) {
			const UUID = randomUUID();
			this.SetImage(UUID, Image.url as string);
			result.push({
				UUID: UUID,
				Response: Image,
			});
		}

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

	/**
	 * Creates an image variation from the OpenAI API
	 * @param VariationOptions
	 * @returns
	 */
	public async GenerateVariation(VariationOptions: {
		image: File;
		n?: number;
		size?: string;
		user?: string;
		options?: AxiosRequestConfig;
	}): Promise<ImageResult[]> {
		const variations = await this.openAI
			.createImageVariation(
				VariationOptions.image,
				VariationOptions.n,
				VariationOptions.size,
				"url",
				VariationOptions.user,
				VariationOptions.options
			)
			.catch((err) => {
				console.error(err);
				return null;
			});

		if (!variations) return [];

		const result: ImageResult[] = [];

		for (let i = 0; i < variations.data.data.length; i++) {
			const variation = variations.data.data[i];
			const UUID = randomUUID();
			this.SetImage(UUID, variation.url as string);
			result.push({
				UUID: UUID,
				Response: variation,
			});
		}

		return result;
	}

  // todo - implement this
	public GetDiscordCDNAttachment(file:string) {
    const cnd_url = "https://cdn.discordapp.com/attachments/";
  }
}

export const openai = new OpenAPIWrapper(configuration)