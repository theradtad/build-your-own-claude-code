async function read(args: {file_path: string}) {
    try {
        console.log("5. In read file");
        const data = await Bun.file(args.file_path).text(); 
        console.log("6. Read file");
        process.stdout.write(data)
    } catch (error) {
        console.log("Failed to read file with error: " + error)
    }
}

export { read };