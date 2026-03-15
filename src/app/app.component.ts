import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TranslocoRootModule } from "./transloco-root.module";

@Component({
    selector: "app-root",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterOutlet, TranslocoRootModule],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
})
export class AppComponent {}
