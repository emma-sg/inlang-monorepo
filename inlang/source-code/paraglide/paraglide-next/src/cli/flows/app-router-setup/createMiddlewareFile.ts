import type { Logger } from "@inlang/paraglide-js/internal";
import type { Repository } from "@lix-js/client";
import type { NextJSProject } from "../scan-next-project";
import type { CliStep } from "../../utils";
import path from "node:path";

export const createMiddlewareFile: CliStep<
  { repo: Repository; logger: Logger; nextProject: NextJSProject },
  unknown
> = async (ctx) => {
  const middlewareFilePath = path.join(
    ctx.nextProject.srcRoot,
    ctx.nextProject.typescript ? "middleware.ts" : "middleware.js",
  );

  //check if the middleware file already exists
  let alreadyExists: boolean;
  try {
    await ctx.repo.nodeishFs.stat(middlewareFilePath);
    alreadyExists = true;
  } catch {
    //if the middleware file doesn't exist, create it
    alreadyExists = false;
  }

  if (alreadyExists) {
    ctx.logger.warn(
      "Skipping creating the `middleware.ts` file as it already exists. Please manually add the middleware exported from @/lib/i18n",
    );
    return ctx;
  }

  const file = `// file generated by the Paraglide-Next init command
import { middleware as paraglide } from "@/lib/i18n"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
	// feel free to edit the request / response
	// and chain in other middlewares
	const response = paraglide(request)
	return response
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
}
`;

  //create the folder if it doesn't exist
  await ctx.repo.nodeishFs.mkdir(path.dirname(middlewareFilePath), {
    recursive: true,
  });
  await ctx.repo.nodeishFs.writeFile(middlewareFilePath, file);
  return ctx;
};
