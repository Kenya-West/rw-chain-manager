import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";

@Component({
    selector: "app-about",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCardModule, MatDividerModule],
    template: `
        <h1 class="mb-6 text-2xl font-semibold text-gray-800">About</h1>

        <mat-card class="max-w-2xl" appearance="outlined">
            <mat-card-header>
                <mat-card-title>RW Chain Manager</mat-card-title>
                <mat-card-subtitle>Version 0.0.1</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="mt-4">
                <p class="mb-4 text-gray-600">
                    A web-based interface for Remnawave proxy panel, designed to
                    detect and inspect proxy chains created in it. Built with
                    Angular and Angular Material.
                </p>

                <mat-divider />

                <h3 class="mb-2 text-base font-medium">
                    What about my data? Do you care about it? Personal data
                    compliance?
                </h3>
                <div class="text-sm text-gray-600">
                    <p>
                        This is a static web page that runs entirely in your
                        browser. I do not care shit about your data, you can
                        only cry about it. Also, fuck GDPR/DMCA/152-FA and all
                        other useless regulations that only serve to protect
                        corporations at the expense of user privacy.
                    </p>
                    <br />
                    <p>sincerely yours,</p>
                    <p>Kenya-West</p>
                </div>

                <mat-divider />

                <div class="mt-4">
                    <h3 class="mb-2 text-base font-medium">Technology Stack</h3>
                    <ul
                        class="list-inside list-disc space-y-1 text-sm text-gray-600"
                    >
                        <li>Angular 21</li>
                        <li>Angular Material</li>
                        <li>Tailwind CSS 4</li>
                        <li>TypeScript</li>
                    </ul>
                </div>

                <mat-divider class="my-4" />

                <div>
                    <h3 class="mb-2 text-base font-medium">Author</h3>
                    <p class="text-sm text-gray-600">
                        <a
                            href="https://github.com/kenya-west"
                            target="_blank"
                            class="text-indigo-600 underline"
                            >Kenya-West</a
                        >
                        •
                        <a
                            href="https://hire.kenyawest.me"
                            target="_blank"
                            class="text-indigo-600 underline"
                            >Hire Me</a
                        >
                    </p>
                </div>
            </mat-card-content>
        </mat-card>
    `,
})
export class AboutComponent {}
