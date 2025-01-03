import { LitElement, css, html } from "lit"

export default class Element extends LitElement {
	static override styles = css`
		:host {
			display: inline-flex;
			width: 100%;
			height: auto;
		}
		.doc-video {
			width: 100% !important;
			height: auto !important;
			border-radius: 8px;
			border: 1px solid #e0e0e0;
		}
	`
	static override properties = {
		src: { type: String },
		type: { type: String },
	}

	src!: string
	type!: string

	constructor() {
		super()
		this.type = "video/mp4"
	}

	override render() {
		return html`<video class="doc-video" controls autoplay muted>
			<source src=${this.src} type=${this.type} />
		</video>`
	}
}

if (typeof customElements !== "undefined" && !customElements.get("doc-video")) {
	customElements.define("doc-video", Element)
}
