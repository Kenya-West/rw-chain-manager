import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";

export interface LogEntry {
    level: "info" | "debug" | "warn" | "error";
    message: string;
}

const LEVEL_ICON: Record<LogEntry["level"], string> = {
    info: "info",
    debug: "bug_report",
    warn: "warning",
    error: "error",
};

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
    info: "text-blue-600",
    debug: "text-gray-500",
    warn: "text-amber-600",
    error: "text-red-600",
};

@Component({
    selector: "app-log-viewer",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatExpansionModule, MatIconModule],
    template: `
        @if (logs().length > 0) {
            <mat-accordion>
                <mat-expansion-panel>
                    <mat-expansion-panel-header>
                        <mat-panel-title
                            class="flex items-center gap-2"
                        >
                            <mat-icon class="text-gray-500"
                                >terminal</mat-icon
                            >
                            Detection Log
                        </mat-panel-title>
                        <mat-panel-description>
                            {{ logs().length }} entries
                        </mat-panel-description>
                    </mat-expansion-panel-header>

                    <div
                        class="max-h-[400px] overflow-y-auto rounded bg-gray-50 font-mono text-xs"
                    >
                        @for (entry of logs(); track $index) {
                            <div
                                class="flex items-start gap-2 border-b border-gray-100 px-3 py-1.5"
                            >
                                <mat-icon
                                    class="shrink-0 {{ getColor(entry.level) }}"
                                    style="
                                        font-size: 14px;
                                        width: 14px;
                                        height: 14px;
                                        margin-top: 2px;
                                    "
                                    >{{ getIcon(entry.level) }}</mat-icon
                                >
                                <span
                                    class="inline-block w-12 shrink-0 rounded px-1 text-center uppercase {{ getLevelBg(entry.level) }}"
                                    >{{ entry.level }}</span
                                >
                                <span class="whitespace-pre-wrap break-all text-gray-700">{{
                                    entry.message
                                }}</span>
                            </div>
                        }
                    </div>
                </mat-expansion-panel>
            </mat-accordion>
        }
    `,
})
export class LogViewerComponent {
    readonly logs = input.required<LogEntry[]>();

    getIcon(level: LogEntry["level"]): string {
        return LEVEL_ICON[level];
    }

    getColor(level: LogEntry["level"]): string {
        return LEVEL_COLOR[level];
    }

    getLevelBg(level: LogEntry["level"]): string {
        switch (level) {
            case "info":
                return "bg-blue-100 text-blue-700";
            case "debug":
                return "bg-gray-200 text-gray-600";
            case "warn":
                return "bg-amber-100 text-amber-700";
            case "error":
                return "bg-red-100 text-red-700";
        }
    }
}
