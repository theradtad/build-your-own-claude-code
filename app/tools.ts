import fs from "fs/promises"

async function read(args: {file_path:String}) {
    try {
        const data = await fs.readFile(args.file_path); 
        console.log(data)
    } catch (error) {
        console.log("Failed to read file with error: " + error)
    }
}

export { read };