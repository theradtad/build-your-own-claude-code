async function read(args: {file_path: string}): Promise<string> {
    try {
        const data = await Bun.file(args.file_path).text(); 
        return data;
    } catch (error) {
        return "Failed to read file with error: " + error;
    }
}

export { read };