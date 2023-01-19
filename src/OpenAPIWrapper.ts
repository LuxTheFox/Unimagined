import { Configuration, CreateImageRequest, ImagesResponseDataInner, OpenAIApi } from "openai";
import { AxiosRequestConfig } from 'axios';
import { randomUUID } from 'crypto';
import config from "./config.json"
import fs from 'fs';

const configuration = new Configuration({
	apiKey: config["openai_key"],
}); //Dont add orginization without inviting me since I get error 401 Unauthorized

class OpenAPIWrapper {
	private openAI: OpenAIApi;
	private Images = new Map();
	constructor(configuration: Configuration) {
		this.openAI = new OpenAIApi(configuration)
	};

	/*
	Setimage and Getimage function notes,
	
	Could be useful depending on what command we add
	Could delete if not used in final project
	*/
	private SetImage(UUID: string, ImageURL: string) {
		this.Images.set(UUID, ImageURL);
	}; //Setting the URL of an image in storage with a UUID

	public GetImage(UUID: string) {
		return this.Images.get(UUID);
	}; //Getting the URL of an image from the UUID

	//Simple, Fetch URL -> return buffer that can used with other OpenAI endpoints
	async GetBufferFromURL(URL: string) {
		const ArrayBuffer = await(await fetch(URL)).arrayBuffer();
		const ConvertedBuffer: Buffer = Buffer.from(ArrayBuffer)
		const FinalBuffer: any = ConvertedBuffer;
		FinalBuffer.name = 'image.png';
		return FinalBuffer;
	};
	
	/*Simple, Call the createImage endpoint with the requested options an

	Extra notes
	Runs through each image and generates a UUID for use with the SetImage function
	If we end up removing set image we can just return { response: Image } inside the foreach loop
	*/
	async GenerateImage(OpenAIOptions: CreateImageRequest, AxiosOptions?: AxiosRequestConfig) {
		const Images = await this.openAI.createImage({
			...OpenAIOptions,
			response_format: 'url'
		}, AxiosOptions);

		const result: { UUID: string, Response: ImagesResponseDataInner }[] = [];
		Images.data.data.forEach(Image => {
			const UUID = randomUUID();
			this.SetImage(UUID, Image.url as string);
			result.push({
				UUID: UUID,
				Response: Image
			});
		});
		return result;
	};

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

	/*
	Basically the same as the generate image function but with the CreateImageVariation Endpoint
	*/
	async GenerateVariation(VariationOptions: {
		image: File,
		n?: number, 
		size?: string,
		user?: string,
		options?: AxiosRequestConfig
	}) {
		const variations = await this.openAI.createImageVariation(
			VariationOptions.image,
			VariationOptions.n,
			VariationOptions.size,
			"url",
			VariationOptions.user,
			VariationOptions.options);
		
		const result: { UUID: string, Response: ImagesResponseDataInner }[] = [];
		variations.data.data.forEach(variation => {
			const UUID = randomUUID();
			this.SetImage(UUID, variation.url as string);
			result.push({
				UUID: UUID,
				Response: variation
			});
		});
		
		return result;
	};
}

export const openai = new OpenAPIWrapper(configuration)