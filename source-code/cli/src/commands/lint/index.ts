import { Command } from "commander"
import Table from "cli-table3"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { bold, italic } from "../../utilities/format.js"
import { log } from "../../utilities/log.js"
import type { InlangProject } from "@inlang/app"

export const lint = new Command()
	.command("lint")
	.description("Commands for linting translations.")
	.option("--no-fail", "Disable throwing an error if linting fails.") // defaults to false https://github.com/tj/commander.js#other-option-types-negatable-boolean-and-booleanvalue
	.action(async () => {
		const { data: inlang, error } = await getInlangProject()
		if (error) {
			log.error(error)
			return
		}
		await lintCommandAction({ inlang, logger: log })
	})

export async function lintCommandAction(args: { inlang: InlangProject; logger: any }) {
	try {
		if (args.inlang.installed.lintRules().length === 0) {
			args.logger.error(
				`🚫 For this command to work, you need lint rules configured in your project.inlang.json – for example, the ${bold(
					"@inlang/plugin-standard-lint-rule",
				)} plugin: https://github.com/inlang/inlang/tree/main/source-code/plugins/standard-lint-rules. ${italic(
					"Learn more about lints here:",
				)} https://inlang.com/documentation/lint`,
			)
			return
		}

		// Init linting
		await args.inlang.lint.init()

		// Get lint reports
		const lintReport = await args.inlang.lint.reports()

		if (lintReport.length === 0) {
			args.logger.success("🎉 Linting successful.")
			return
		}

		// Map over lints with correct log function
		const lintTable = new Table({
			head: ["Level", "Lint Rule", "Message"],
			colWidths: [12, 35, 50],
			wordWrap: true,
		})

		let hasError = false

		for (const lint of lintReport) {
			if (lint.level === "error") {
				hasError = true
				lintTable.push(["Error", lint.ruleId, lint.body.en])
			} else if (lint.level === "warning") {
				lintTable.push(["Warning", lint.ruleId, lint.body.en])
			}
		}

		args.logger.log("") // spacer line
		args.logger.log("🚨 Lint Report")
		args.logger.log(lintTable.toString())

		// create summary table with total number of errors and warnings
		const summaryTable = new Table({
			head: ["Level", "Count"],
		})

		summaryTable.push(["Error", lintReport.filter((lint) => lint.level === "error").length])
		summaryTable.push(["Warning", lintReport.filter((lint) => lint.level === "warning").length])

		args.logger.log("") // spacer line
		args.logger.log("📊 Summary")
		args.logger.log(summaryTable.toString())

		if (hasError && lint.opts().fail) {
			// spacer line
			args.logger.log("")
			args.logger.info(
				"ℹ️  You can add the `--no-fail` flag to disable throwing an error if linting fails.",
			)
			console.error("🚫 Lint failed with errors.")
			process.exit(1)
		}

		return { lintTable, summaryTable }
	} catch (error) {
		args.logger.error(error)
	}
}
