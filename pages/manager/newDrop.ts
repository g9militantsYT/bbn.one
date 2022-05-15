import '../../assets/css/main.css';
import '../../assets/css/components/subsidiaries.css';
import '../../assets/css/wizard.css';
import { DynaNavigation } from "../../components/nav.ts";
import primary from "../../data/primary.json" assert { type: "json"};
import language from "../../data/language.json" assert { type: "json"};

import { View, WebGen, Horizontal, PlainText, Vertical, Spacer, Input, Button, ButtonStyle, SupportedThemes, Grid, MaterialIcons, Color, DropDownInput, Wizard, Page, createElement, img, Custom, Component } from "../../deps.ts";
import { TableData } from "./types.ts";
import { allowedAudioFormats, allowedImageFormats, Center, CenterAndRight, DropAreaInput, Table, UploadTable } from "./helper.ts";
import { TableDef } from "./music/table.ts";

WebGen({
    theme: SupportedThemes.dark,
    icon: new MaterialIcons()
})

const gapSize = "15px";
const inputWidth = "436px";
function syncFromData(formData: FormData, key: string) {
    return {
        liveOn: (value: string) => formData.set(key, value),
        value: formData.get(key)?.toString(),
    }
}
function uploadFilesDialog(onData: (files: { blob: Blob, file: File, url: string }[]) => void, accept: string) {
    const upload = createElement("input")
    upload.type = "file";
    upload.accept = accept;
    upload.click();
    upload.onchange = async () => {
        const list = await Promise.all(Array.from(upload.files ?? []).map(async file => {
            const blob = new Blob([ await file.arrayBuffer() ], { type: file.type });
            return { blob, file, url: URL.createObjectURL(blob) };
        }))
        onData(list);
    };
}

// TODO: Upload logic should be reusabled
// TODO: Live-Sync
// TODO: "Upload" zu FormDaten Supporten
// TODO: Input zu neuen FormComponents umlagern
View(() => Vertical(
    DynaNavigation("Music"),
    Spacer(),
    Wizard({
        cancelAction: "/music",
        buttonArrangement: "space-between",
        submitAction: () => {

        }
    }, ({ Next }) => [
        Page((formData) => [
            PlainText("Lets make your Drop hit!"),
            Spacer(),
            Horizontal(
                Spacer(),
                Vertical(
                    Center(PlainText("First we need an UPC/EAN number:")),
                    Input({
                        ...syncFromData(formData, "upc"),
                        placeholder: "UPC/EAN"
                    }).setWidth(inputWidth),
                    Button("I don't have one")
                        .setJustify("center")
                        .setStyle(ButtonStyle.Secondary)
                        .onClick(Next)
                ).setGap(gapSize),
                Spacer()
            ),
        ]),
        Page((formData) => [
            Spacer(),
            Center(
                Vertical(
                    Center(PlainText("Enter your Album details.")),
                    Input({
                        ...syncFromData(formData, "name"),
                        placeholder: "Name"
                    }).setWidth(inputWidth),
                    Grid(
                        Input({
                            ...syncFromData(formData, "releaseDate"),
                            placeholder: "Release Date",
                            type: "text"
                        }),
                        DropDownInput("Language", language)
                            .syncFormData(formData, "language")
                            .addClass("custom")
                    )
                        .setEvenColumns(2)
                        .setGap(gapSize)
                        .setWidth(inputWidth),
                    Input({
                        placeholder: "Artistlist",
                        ...syncFromData(formData, "artistList"),
                    }),
                    Center(PlainText("Set your target Audience")),
                    Grid(
                        DropDownInput("Primary Genre", primary)
                            .syncFormData(formData, "primaryGenre")
                            .addClass("custom"),
                        DropDownInput("Secondary Genre", primary)
                            .setStyle(ButtonStyle.Secondary)
                            .setColor(Color.Disabled),
                    )
                        .setGap(gapSize)
                        .setEvenColumns(2)
                ).setGap(gapSize)
            ),
        ]),
        Page((formData) => [
            Spacer(),
            Center(
                Vertical(
                    Center(PlainText("Display the Copyright")),
                    Input({
                        placeholder: "Composition Copyright",
                        ...syncFromData(formData, "compositionCopyright")
                    })
                        .setWidth(inputWidth),
                    Input({
                        placeholder: "Sound Recording Copyright",
                        ...syncFromData(formData, "soundRecordingCopyright")
                    })
                        .setWidth(inputWidth),
                )
                    .setGap(gapSize)
            ),
        ]),
        Page((formData) => [
            Spacer(),
            Center(
                View(({ update }) =>
                    Vertical(
                        CenterAndRight(
                            PlainText("Upload your Cover"),
                            Button("Manual Upload")
                                .onClick(() => uploadFilesDialog(([ { blob, url } ]) => {
                                    formData.set("cover.image.url", url)
                                    formData.set("cover.image", blob)
                                    update({});
                                }, allowedImageFormats.join(",")))
                        ),
                        DropAreaInput("Drag & Drop your File here", ImageFrom(formData, "cover.image.url"), (blob, url) => {
                            formData.set("cover.image.url", url)
                            formData.set("cover.image", blob)
                            update({});
                        })
                    )
                        .setGap(gapSize)
                ).asComponent()
            ),
        ]),
        Page((formData) => [
            Spacer(),
            Horizontal(
                Spacer(),
                View(({ update }) =>
                    Vertical(
                        CenterAndRight(
                            PlainText("Manage your Music"),
                            Button("Manual Upload")
                                .onClick(() => uploadFilesDialog((list) => addSongs(list, formData, update), allowedAudioFormats.join(",")))
                        ),
                        formData.has("songs") ?
                            Table<TableData>(TableDef(formData), formData.getAll("songs").map(x => {
                                return <TableData>{
                                    Id: x,
                                    Name: formData.get(`song.${x}.name`)?.toString(),
                                    Year: formData.get(`song.${x}.year`)?.toString(),
                                    Explicit: formData.get(`song.${x}.explicit`) == "true",
                                };
                            }))
                                .addClass("inverted-class")
                            : UploadTable(TableDef(formData), (list) => addSongs(list, formData, update))
                                .addClass("inverted-class")

                    ).setGap(gapSize),
                ).asComponent(),
                Spacer()
            ),
        ]),
        Page((_formData) => [
            Spacer(),
            Horizontal(
                Spacer(),
                PlainText("Thank! Thats everything we need."),
                Spacer(),
            ),
            Horizontal(
                Spacer(),
                Input({
                    placeholder: "Comments for Submit"
                }),
                Spacer()
            ),
        ])
    ])
))
    .addClass("fullscreen")
    .appendOn(document.body)

function addSongs(list: { blob: Blob; file: File; }[], formData: FormData, update: (data: Partial<unknown>) => void) {
    list.map(x => ({ ...x, id: crypto.randomUUID() })).forEach(({ blob, file, id }) => {
        formData.append("songs", id);
        const cleanedUpName = file.name
            .replaceAll("_", " ")
            .replaceAll("-", " ")
            .replace(/\.[^/.]+$/, "");

        formData.set(`song.${id}.blob`, blob);
        formData.set(`song.${id}.name`, cleanedUpName); // Our AI prediceted name
        formData.set(`song.${id}.year`, new Date().getFullYear().toString());
        // TODO Add Defaults for Country, Primary Genre => Access global FormData and merge it to one and then pull it
    });
    update({});
}

function ImageFrom(formData: FormData, key: string): Component | undefined {
    return formData.has(key) ? Custom(img(formData.get(key)! as string)) : undefined;
}