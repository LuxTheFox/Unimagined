import config from "./config.json"
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
	organization: "org-GrLBBpXPQKHBtvr5f9H8ITe4",
	apiKey: config["openai_key"],
});

export const openai = new OpenAIApi(configuration);