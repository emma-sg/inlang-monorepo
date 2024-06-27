// ensure_OPRAL_upper_case

import type { MessageBundleLintRule } from "../types/lint.js"

const orpalRegex = /\bOPRAL\b/gi

const makeOpralUppercase: MessageBundleLintRule = {
	id: "messageBundleLintRule.inlangdev.makeOpralUppercase",
	displayName: "Ensure OPRAL is uppercase",
	description: "Warns if the OPRAL brand name is not uppercase",
	run: ({ report, messageBundle }) => {
		console.log("makeOpralUppercase", messageBundle)
		// loop over all messages and variants in the bundle
		for (const message of messageBundle.messages) {
			for (const variant of message.variants) {
				const text = variant.pattern
					.filter((el): el is Extract<typeof el, { type: "text" }> => el.type === "text")
					.reduce((acc, el) => acc + el.value, "")

				const matches = text.match(orpalRegex)
				if (!matches) continue

				// check if any of the matches is not uppercase
				for (const match of matches) {
					if (match !== match.toUpperCase()) {
						console.log("reporting", text)
						report({
							body: `The OPRAL brand name is not uppercase`,
							messageBundleId: messageBundle.id,
							messageId: message.id,
							variantId: variant.id,
							locale: message.locale,
							fixes: [
								{
									title: "Make OPRAL uppercase",
								},
							],
						})
					}
				}
			}
		}
	},
	fix: async ({ report, fix, messageBundle }) => {
		if (fix.title !== "Make OPRAL uppercase") return messageBundle

		if (!report.variantId || !report.messageId)
			throw new Error("report must have variantId and messageId")

		const msg = messageBundle.messages.find((msg) => msg.id === report.messageId)
		if (!msg) throw new Error(`message ${report.messageId} not found on bundle ${messageBundle.id}`)

		const variant = msg.variants.find((variant) => variant.id === report.variantId)
		if (!variant) throw new Error(`variant ${report.variantId} not found on message ${msg.id}`)

		variant.pattern = variant.pattern.map((el) => {
			if (el.type !== "text") return el
			el.value = el.value.replaceAll(orpalRegex, "OPRAL")
			return el
		})

		return messageBundle
	},
}

export default makeOpralUppercase