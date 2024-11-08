// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import './Table.js';

import * as i18n from '../../../../core/i18n/i18n.js';
import type {FontDisplayInsightModel} from '../../../../models/trace/insights/FontDisplay.js';
import type * as Trace from '../../../../models/trace/trace.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import type * as Overlays from '../../overlays/overlays.js';

import {eventRef} from './EventRef.js';
import {BaseInsightComponent, shouldRenderForCategory} from './Helpers.js';
import type * as SidebarInsight from './SidebarInsight.js';
import type {TableData} from './Table.js';
import {Category} from './types.js';

const {html} = LitHtml;

const UIStrings = {
  /** Title of an insight that provides details about the fonts used on the page, and the value of their `font-display` properties. */
  title: 'Font display',
  /**
   * @description Text to tell the user about the font-display CSS feature to help improve a the UX of a page.
   */
  description:
      'Consider setting [`font-display`](https://developer.chrome.com/blog/font-display) to `swap` or `optional` to ensure text is consistently visible. `swap` can be further optimized to mitigate layout shifts with [font metric overrides](https://developer.chrome.com/blog/font-fallbacks).',
  /** Column for a font loaded by the page to render text. */
  fontColumn: 'Font',
  /** Column for the amount of time wasted. */
  wastedTimeColumn: 'Wasted time',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/components/insights/FontDisplay.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class FontDisplay extends BaseInsightComponent<FontDisplayInsightModel> {
  static override readonly litTagName = LitHtml.literal`devtools-performance-font-display`;
  override insightCategory = Category.INP;
  override internalName: string = 'font-display';
  override userVisibleTitle: string = i18nString(UIStrings.title);
  override description: string = i18nString(UIStrings.description);

  #overlayForRequest = new Map<Trace.Types.Events.SyntheticNetworkRequest, Overlays.Overlays.TimelineOverlay>();

  override createOverlays(): Overlays.Overlays.TimelineOverlay[] {
    this.#overlayForRequest.clear();

    if (!this.model) {
      return [];
    }

    for (const font of this.model.fonts) {
      this.#overlayForRequest.set(font.request, {
        type: 'ENTRY_OUTLINE',
        entry: font.request,
        outlineReason: font.wastedTime ? 'ERROR' : 'INFO',
      });
    }

    return [...this.#overlayForRequest.values()];
  }

  #render(insight: Trace.Insights.Types.InsightModels['FontDisplay']): LitHtml.TemplateResult {
    // clang-format off
    return html`
        <div class="insights">
            <devtools-performance-sidebar-insight .data=${{
              title: this.userVisibleTitle,
              description: this.description,
              expanded: this.isActive(),
              internalName: this.internalName,
              estimatedSavingsTime: insight.metricSavings?.FCP,
            } as SidebarInsight.InsightDetails}
            @insighttoggleclick=${this.onSidebarClick}>
                <div slot="insight-content" class="insight-section">
                  ${html`<devtools-performance-table
                    .data=${{
                      insight: this,
                      headers: [i18nString(UIStrings.fontColumn), 'font-display', i18nString(UIStrings.wastedTimeColumn)],
                      rows: insight.fonts.map(font => ({
                        values: [
                          // TODO(crbug.com/369422196): the font name would be nicer here.
                          eventRef(font.request),
                          font.display,
                          i18n.TimeUtilities.millisToString(font.wastedTime),
                        ],
                        overlays: [this.#overlayForRequest.get(font.request)],
                      })),
                    } as TableData}>
                  </devtools-performance-table>`}
                </div>
            </devtools-performance-sidebar-insight>
        </div>`;
    // clang-format on
  }

  override getRelatedEvents(): Trace.Types.Events.Event[] {
    return this.model?.relatedEvents ?? [];
  }

  override render(): void {
    const model = this.model;
    const shouldShow = model && model.fonts.find(font => font.wastedTime);

    const matchesCategory = shouldRenderForCategory({
      activeCategory: this.data.activeCategory,
      insightCategory: this.insightCategory,
    });
    const output = shouldShow && matchesCategory ? this.#render(model) : LitHtml.nothing;
    LitHtml.render(output, this.shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-font-display': FontDisplay;
  }
}

customElements.define('devtools-performance-font-display', FontDisplay);
