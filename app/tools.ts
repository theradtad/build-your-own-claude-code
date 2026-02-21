async function read(args: {file_path: string}): Promise<string> {
    try {
        const data = await Bun.file(args.file_path).text(); 
        return data;
    } catch (error) {
        return "Failed to read file with error: " + error;
    }
}

async function write(args: {file_path: string, content: string}): Promise<string> {
    try {
        await Bun.write(args.file_path, args.content)
        return "Successfully wrote to file " + args.file_path;
    } catch (error) {
        return "Failed to write to file " + args.file_path + " with error: " + error;
    }
}

export { read, write };