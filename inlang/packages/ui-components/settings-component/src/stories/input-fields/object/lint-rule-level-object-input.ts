import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../field-header.js";

@customElement("lint-rule-level-object-input")
export class LintRuleLevelObjectInput extends LitElement {
  static override styles = [
    css`
      .property {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .container {
        display: flex;
        flex-direction: column;
        padding-top: 8px;
        gap: 12px;
      }
      .ruleId {
        font-size: 0.8rem;
        margin: 0;
        color: var(--sl-input-color);
      }
      .rule-container {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .select {
        max-width: 140px;
        min-width: 100px;
      }
      .title-container {
        display: flex;
        gap: 8px;
      }
      sl-select::part(expand-icon) {
        color: var(--sl-input-placeholder-color);
      }
      sl-select::part(expand-icon):hover {
        color: var(--sl-input-color);
      }
      sl-select::part(base):hover {
        border: var(--sl-input-placeholder-color);
      }
      .level-icon {
        color: var(--sl-color-neutral-400);
        margin-top: 1px;
        margin-right: 6px;
      }
      .level-icon.danger {
        color: var(--sl-color-danger-600);
      }
    `,
  ];

  @property()
  property: string = "";

  @property()
  moduleId?: string;

  @property()
  modules?: Array<any>;

  @property()
  value: Record<string, string> = {};

  @property()
  schema: any = {};

  @property()
  required?: boolean = false;

  @property()
  handleInlangProjectChange: (
    value: Record<string, string>,
    key: string,
    moduleId?: string
  ) => void = () => {};

  private get _description(): string | undefined {
    return this.schema.description || undefined;
  }

  private get _title(): string | undefined {
    return this.schema.title || undefined;
  }

  private get _valueOptions(): Array<Record<string, string>> | undefined {
    const valuesOptions = //@ts-ignore
    Object.values(this.schema.patternProperties)[0]?.anyOf;
    return valuesOptions ? valuesOptions : undefined;
  }

  handleUpdate(
    key: `plugin.${string}.${string}` | `messageLintRule.${string}.${string}`,
    value: string
  ) {
    if (key && value) {
      if (!this.value) {
        this.value = {};
      }
      this.value[key] = value;
      this.handleInlangProjectChange(this.value, this.property, this.moduleId);
    }
  }

  override async update(changedProperties: any) {
    super.update(changedProperties);

    // TODO find a better way to update the value
    if (changedProperties.has("value")) {
      await this.updateComplete;

      const newValue = changedProperties.get("value");

      if (newValue) {
        for (const moduleId of Object.keys(newValue)) {
          const slSelect = this.shadowRoot?.getElementById(moduleId);
          if (slSelect) {
            const input = slSelect.shadowRoot?.querySelector<HTMLInputElement>(
              ".select__display-input"
            );
            if (input && input.value) {
              input.value = this.value[moduleId as string]
                ? (this.value[moduleId as string] as string)
                : "warning";
            }
          }
        }
      }
    }
  }

  override render() {
    return this.modules &&
      this.modules.some((module) => module.id.split(".")[0] !== "plugin")
      ? html` <div part="property" class="property">
          <div class="title-container">
            <field-header
              .fieldTitle=${this._title ? this._title : this.property}
              .description=${this._description}
              .optional=${this.required ? false : true}
              exportparts="property-title, property-paragraph"
            ></field-header>
          </div>
          <div class="container">
            ${this.modules &&
            this.modules.map((module) => {
              return module.id.split(".")[0] !== "plugin"
                ? html`<div class="rule-container">
                    <sl-select
                      id=${module.id}
                      exportparts="listbox:option-wrapper"
                      value=${this.value
                        ? (this.value as any)[module.id]
                        : "warning"}
                      placeholder="warning"
                      class="select"
                      size="small"
                      @sl-change=${(e: Event) => {
                        this.handleUpdate(
                          module.id as `messageLintRule.${string}.${string}`,
                          (e.target as HTMLInputElement).value
                        );
                      }}
                    >
                      ${(this.value as any)[module.id] === "error"
                        ? html`<svg
                            class="level-icon danger"
                            slot="prefix"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M12 17q.425 0 .713-.288T13 16t-.288-.712T12 15t-.712.288T11 16t.288.713T12 17m0-4q.425 0 .713-.288T13 12V8q0-.425-.288-.712T12 7t-.712.288T11 8v4q0 .425.288.713T12 13m0 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
                            />
                          </svg>`
                        : html`<svg
                            class="level-icon"
                            slot="prefix"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M12 17q.425 0 .713-.288T13 16t-.288-.712T12 15t-.712.288T11 16t.288.713T12 17m0-4q.425 0 .713-.288T13 12V8q0-.425-.288-.712T12 7t-.712.288T11 8v4q0 .425.288.713T12 13m0 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
                            />
                          </svg>`}
                      ${this._valueOptions?.map((option) => {
                        return html`<sl-option
                          exportparts="base:option"
                          value=${option.const}
                          class="add-item-side"
                        >
                          ${option.const}
                        </sl-option>`;
                      })}
                    </sl-select>
                    <p class="ruleId">
                      ${(module.displayName as { en: string }).en}
                    </p>
                  </div>`
                : undefined;
            })}
          </div>
        </div>`
      : undefined;
  }
}

// add types
declare global {
  interface HTMLElementTagNameMap {
    "lint-rule-level-object-input": LintRuleLevelObjectInput;
  }
}
