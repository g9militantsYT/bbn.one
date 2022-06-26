// This code Will be proted to webgen

import { Box, Button, Card, Component, Custom, Dialog, DropDownInput, Grid, headless, Horizontal, Icon, Input, Page, PlainText, Spacer, Vertical, View } from "../../deps.ts";
import { DeleteFromForm } from "./data.ts";
import { API, ArtistTypes, Drop } from "./RESTSpec.ts";
import { ColumEntry } from "./types.ts";

export const allowedAudioFormats = [ "audio/flac", "audio/wav" ];
export const allowedImageFormats = [ "image/png", "image/jpeg" ];

export type ProfileData = {
    user: string;
    name: string;
    email: string;
    groups: {
        slug: string,
        permissions: string[]
    }[];
    picture?: string;
    exp?: number;
};
export function IsLoggedIn(): ProfileData | null {
    return localStorage[ "access-token" ] ? JSON.parse(atob(localStorage[ "access-token" ]?.split(".")[ 1 ])) : null;
}

/**
 * @deprecated
 */
export function GetCachedProfileData(): ProfileData {
    return JSON.parse(atob(localStorage[ "access-token" ].split(".")[ 1 ]));
}
export async function renewAccessTokenIfNeeded(exp?: number) {
    if (!exp) return Redirect();
    // We should renew the token 30s before it expires
    if (isExpired(exp)) {
        try {
            const { accessToken } = await API.auth.refreshAccessToken.post({ refreshToken: localStorage[ "refresh-token" ] });
            localStorage[ "access-token" ] = accessToken;
            console.log("Refreshed token");
        } catch (_) {
            localStorage.clear();
            Redirect();
        }
    }
}
export function isExpired(exp: number) {
    return exp * 1000 < new Date().getTime() + (0.5 * 60 * 1000);
}

export function RegisterAuthRefresh() {
    const { exp } = GetCachedProfileData()
    if (!exp) {
        localStorage.clear()
        Redirect();
        return;
    }
    renewAccessTokenIfNeeded(exp);
    setInterval(() => renewAccessTokenIfNeeded(GetCachedProfileData().exp), 1000)
}
export function Redirect() {
    if (localStorage[ "refresh-token" ] && location.href.includes("/signin"))
        location.href = "/music"; // TODO do this better
    else if (!localStorage[ "refresh-token" ] && !location.href.includes("/signin"))
        location.href = "/signin";
}

export function CenterAndRight(center: Component, right: Component): Component {
    return Horizontal(
        Spacer(),
        Spacer(),
        Vertical(
            Spacer(),
            center,
            Spacer()
        ),
        Spacer(),
        right
    );
}
class TableComponent<Data> extends Component {
    hasDelete = false;
    #columns: ColumEntry<Data>[];
    #data: Data[]

    constructor(_columns: ColumEntry<Data>[], data: Data[]) {
        super();
        this.#columns = _columns;
        this.#data = data;
        this.refresh();
    }

    setDelete(action: (entry: Data) => void | Promise<void>) {
        this.#columns.push([ "", "max-content",
            (data) => Icon("delete").onClick(async () => {
                await action(data);
                this.refresh();
            })
        ]);
        this.refresh();
        return this;
    }

    refresh() {
        const data = Card(headless(
            Grid(
                ...this.#columns.map(([ id ]) => PlainText(id.toString()).addClass("title")),

                ...this.#data.map((x): Component[] => [
                    ...this.#columns.map(([ _id, _size, render ], index) => render(x, index))
                ]).flat(),
            )
                .setAlign("center")
                .setGap("5px 13px")
                .setWidth("100%")
                .setRawColumns(`${this.#columns.map(([ _, data = "max-content" ]) => data).join(" ")}`)
        )).addClass("wtable").draw();
        this.wrapper = data;
    }
}
export function Table<Data>(_columns: ColumEntry<Data>[], data: Data[]) {
    return new TableComponent(_columns, data);
}

export function syncFromData(formData: FormData, key: string) {
    return {
        liveOn: (value: string) => formData.set(key, value),
        value: formData.get(key)?.toString(),
    }
}

// BBN Stuff
export function getYearList(): string[] {
    return new Array(8)
        .fill(1)
        .map((_, i) => (new Date().getFullYear() + 2) - i)
        .map((x) => x.toString());
}

export function stringToColour(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

export function UploadTable<Data>(_columns: ColumEntry<Data>[], upload: (list: File[]) => void) {
    const table = Table(_columns, []).draw();
    table.ondragleave = (ev) => {
        ev.preventDefault();
        table.classList.remove("hover");
    }
    table.ondragover = (ev) => {
        ev.preventDefault();
        table.classList.add("hover");
    };
    table.ondrop = (ev) => {
        ev.preventDefault();
        upload(Array.from(ev.dataTransfer?.files ?? []).filter(x => allowedAudioFormats.includes(x.type)));
    }
    table.append(Vertical(
        PlainText("Nothing here yet").addClass("droptitle"),
        PlainText("Drag & Drop your Files here").addClass("dropsubtitle")
    ).setGap("2.5rem").addClass("drop-area-label").draw());
    return Custom(table);
}

export function EditArtists(list: NonNullable<Drop[ "artists" ]>) {
    const formdefault = new FormData();
    list.forEach(([ name, _img, type ]) => {
        const id = crypto.randomUUID();
        formdefault.append("actor", id)
        formdefault.set(`actor-${id}-name`, name)
        formdefault.set(`actor-${id}-type`, type)
    });

    const form = Page((data) => [
        View(({ update }) =>
            Vertical(
                Table([
                    [ "Type", "10rem", ({ id }) => DropDownInput("Type", <ArtistTypes[]>[ "PRIMARY", "FEATURING", "PRODUCER", "SONGWRITER" ]).syncFormData(data, `actor-${id}-type`) ],
                    [ "Name", "auto", ({ id }) => Input({ placeholder: "Name", ...syncFromData(data, `actor-${id}-name`) }) ]
                ], data.getAll("actor").map((id) => {
                    return {
                        id: id as string,
                        Name: data.get(`actor-${id}-name`)!.toString(),
                        Type: data.get(`actor-${id}-type`)!.toString()
                    };
                })).setDelete(({ id }) => {
                    DeleteFromForm(data, "actor", (x) => x != id);
                    update({})
                }),
                Horizontal(
                    Spacer(),
                    Button("Add Artist") // TODO: Remove this in the future => switch to ghost rows
                        .onClick(() => {
                            const id = crypto.randomUUID();
                            data.append("actor", id)
                            data.set(`actor-${id}-name`, "")
                            data.set(`actor-${id}-type`, "PRIMARY")
                            update({})
                        })
                ).setPadding("0 0 3rem 0")
            )
                .setGap("var(--gap)")
                .setWidth("clamp(0rem, 100vw, 60vw)")
                .setMargin("0 -.6rem 0 0")
        ).asComponent()
    ])
    return new Promise<Drop[ "artists" ]>((done) => {
        const dialog = Dialog(() => Box(...form.setDefaultValues(formdefault).getComponents()))
            .setTitle("Manage your Artists")
            .allowUserClose()
            .addClass("light-mode")
            .onClose(() => {
                dialog.remove();
            })
            .addButton("Save", () => {
                const data = form.getFormData();
                done(data.getAll("actor")
                    .map((i) =>
                        [ data.get(`actor-${i}-name`), "", data.get(`actor-${i}-type`) ] as
                        [ name: string, img: string, type: ArtistTypes ]
                    ))

                return "remove";
            })
            .open()
    })
}