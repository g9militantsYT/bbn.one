import { ButtonStyle, Checkbox, Color, DropDownInput, PlainText, Spacer } from "../../../deps.ts";
import { getYearList } from "../helper.ts";
import { ColumEntry, TableData } from "../types.ts";

import primary from "../../../data/primary.json" assert { type: "json"};
import language from "../../../data/language.json" assert { type: "json"};


export const TableDef = (formData: FormData) => <ColumEntry<TableData>[]>[
    [ "Name", "auto", ({ Name }) => PlainText(Name ?? "-").setFont(1, 500) ],
    [ "Artists", "max-content", () => Spacer() ],
    [ "Year", "max-content", ({ Id }) =>
        DropDownInput("Year", getYearList())
            .syncFormData(formData, `song.${Id}.year`)
            .setStyle(ButtonStyle.Inline)
    ],
    [ "Country", "max-content", ({ Id }) =>
        DropDownInput("Country", language)
            .syncFormData(formData, `song.${Id}.country`)
            .setStyle(ButtonStyle.Inline)
    ],
    [ "Primary Genre", "max-content", ({ Id }) =>
        DropDownInput("Primary Genre", primary)
            .syncFormData(formData, `song.${Id}.primaryGenre`)
            .setStyle(ButtonStyle.Inline)
    ],
    [ "Secondary Genre", "max-content", () =>
        DropDownInput("Secondary Genre", primary)
            .setStyle(ButtonStyle.Inline)
            .setColor(Color.Disabled)
    ],
    [ "Explicit", "max-content", ({ Explicit }) =>
        Checkbox(Explicit)
    ],
];