import OpenAI from "openai";
import {read} from "./tools";

type functionCall = {"name": string, "arguments": string};
type toolCalls = {"id": string, "type": string, "function": functionCall};

const functionMap: Record<string, Function> = {
  "Read": read,
};

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const tools = [
    {
      "type": "function",
      "function": {
        "name": "Read",
        "description": "Read and return the contents of a file",
        "parameters": {
          "type": "object",
          "properties": {
            "file_path": {
              "type": "string",
              "description": "The path to the file to read"
            }
          },
          "required": ["file_path"]
        }
      }
    },
  ]

  const response = await client.chat.completions.create({
    model: "anthropic/claude-haiku-4.5",
    messages: [{ role: "user", content: prompt }],
    tools: tools,
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error("no choices in response");
  }

  // You can use print statements as follows for debugging, they'll be visible when running tests.
  // console.error("Logs from your program will appear here!");

  console.log("1. In main");
  run_tools(response)

  // TODO: Uncomment the lines below to pass the first stage
  console.log(response.choices[0].message.content);

  
}

function run_tools(response: OpenAI.Chat.Completions.ChatCompletion) {
  const tool_calls : Array<toolCalls> = parse_tool_calls(response)
  console.log("3. In run tool calls")
  if (tool_calls.length === 0) {
    return
  }

  for (let i: number = 0; i < tool_calls.length; i++) {
    const fn_call = tool_calls[i].function

    if (fn_call == null) {
      throw new Error("Invalid function call");
    }
    const func = functionMap[fn_call.name]

    if (func == null) {
      throw new Error("Invalid function call");
    }
    
    const args = JSON.parse(fn_call.arguments)

    console.log("4. Calling function")
    func(args)
  }
}

function parse_tool_calls(response: OpenAI.Chat.Completions.ChatCompletion): Array<toolCalls> {

  console.log("2. In parse tool calls");
  if (!response.choices || response.choices.length === 0) {
    throw new Error("no choices in response");
  }

  const responseJson = JSON.parse(JSON.stringify(response.choices[0].message));
  if (!responseJson.tool_calls || responseJson.tool_calls.length === 0) {
    return new Array();
  }

  return responseJson.tool_calls;
  
}

main();