import type { $fs } from "./$fs.js"

// eslint-disable-next-line no-restricted-imports
import * as nodefs from "node:fs/promises"
import { createMemoryFs, fromNodeFs } from "@inlang-git/fs"

function createFs(fs: $fs): $fs {
	return fs
}

//@ts-ignore - TODO outcomment when fixed
createFs(fromNodeFs(nodefs))

createFs(createMemoryFs())
