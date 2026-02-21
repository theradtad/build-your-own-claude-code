import OpenAI from "openai";
import {read} from "./tools";

type functionCall = {"name": string, "arguments": string};
type toolCalls = {"id": string, "type": string, "function": functionCall};

interface messageObj {"role": string, "content": string}
interface aiMessage extends messageObj {"tool_calls": Array<toolCalls>}
interface toolMessage extends messageObj {"tool_call_id": string}

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
  
  const messages: Array<messageObj> = [{role: "user", content: prompt}]

  do {
    const response = await client.chat.completions.create({
      model: "anthropic/claude-haiku-4.5",
      messages: messages,
      tools: tools,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("no choices in response");
    }


    // You can use print statements as follows for debugging, they'll be visible when running tests.
    console.error("Logs from your program will appear here!");

    const tool_response = await run_tools(response)
    if (tool_response === null || tool_response.length === 0) {
      console.log(response.choices[0].message.content);
      break;
    } else {
      const assistantMsg = {"role": "assistant", "content": null, "tool_calls": JSON.stringify(response.choices[0].message.tool_calls)}
      messages.push(...tool_response);
    }
  } while (true);
}

async function run_tools(response: OpenAI.Chat.Completions.ChatCompletion): Promise<Array<toolMessage> | null> {
  const tool_calls : Array<toolCalls> = parse_tool_calls(response)
  if (tool_calls.length === 0) {
    return null
  }

  const tool_response = []
  for (let i: number = 0; i < tool_calls.length; i++) {
    const fn_call = tool_calls[i].function;
    const tool_call_id = tool_calls[i].id;
    const fn_response = {"role": "tool", "tool_call_id": tool_call_id, "content": ""}

    if (fn_call == null) {
      fn_response.content = "No function key present in tool_call";
      tool_response.push(fn_response);
      break;
    }
    const func = functionMap[fn_call.name]

    if (func == null) {
      fn_response.content = "Function doesn't exist: " + fn_call.name;
      tool_response.push(fn_response);
      break;
    }
    
    const args = JSON.parse(fn_call.arguments)

    const fn_result = await func(args);
    fn_response.content = fn_result;
    tool_response.push(fn_response);
  }

  return tool_response
}

function parse_tool_calls(response: OpenAI.Chat.Completions.ChatCompletion): Array<toolCalls> {

  const responseJson = JSON.parse(JSON.stringify(response.choices[0].message));
  if (!responseJson.tool_calls || responseJson.tool_calls.length === 0) {
    return new Array();
  }

  return responseJson.tool_calls;
  
}

main();