import {
    animate,
    query,
    style,
    transition,
    trigger,
} from "@angular/animations";

export const routeFadeAnimation = trigger("routeFade", [
    transition("* <=> *", [
        query(
            ":enter",
            [
                style({ opacity: 0, transform: "translateY(8px)" }),
                animate(
                    "250ms ease-out",
                    style({ opacity: 1, transform: "translateY(0)" })
                ),
            ],
            { optional: true }
        ),
    ]),
]);
