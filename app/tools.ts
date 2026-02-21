import fs from "fs/promises"

async function read(args: {file_path: string}) {
    try {
        const data = await fs.readFile(args.file_path, {encoding: "utf8"}); 
        process.stdout.write(data)
    } catch (error) {
        console.log("Failed to read file with error: " + error)
    }
}

export { read };