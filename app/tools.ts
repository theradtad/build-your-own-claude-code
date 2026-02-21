async function read(args: {file_path: string}) {
    try {
        const data = await Bun.file(args.file_path).text(); 
        process.stdout.write(data)
    } catch (error) {
        console.log("Failed to read file with error: " + error)
    }
}

export { read };