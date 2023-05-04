import { State, UploadFilesDialog } from "webgen/mod.ts";
import { API } from "../manager/RESTSpec.ts";
import { state } from "./state.ts";
import { StreamingUploadHandler } from "../manager/upload.ts";
import { delay } from "std/async/delay.ts";

export async function refreshState() {
    state.reviews = State(await API.music(API.getToken()).reviews.get());
    state.users = State(await API.user(API.getToken()).list.get());
    state.payouts = State(await API.payment(API.getToken()).payouts.get());
    state.oauth = State(await API.oauth(API.getToken()).list());
    state.files = State(await API.admin(API.getToken()).files.list());
}

const urls = {
    "isrc": ["payment/payout/isrcsync", '.xlsx'],
    "manual": ["payment/payout/upload", '.xlsx'],
    "oauth": ["admin/uploadfiles", 'image/*']
}
export function upload(type: keyof typeof urls): Promise<string> {
    const [url, extension] = urls[type];
    return new Promise(resolve => {
        UploadFilesDialog((list) => {
            StreamingUploadHandler(url, {
                failure: () => {
                    //state.loading = false;
                    alert("Your Upload has failed. Please try a different file or try again later");
                },
                uploadDone: () => {
                    console.log("Upload done");
                },
                credentials: () => API.getToken(),
                backendResponse: (id) => {
                    console.log(id);
                    resolve(id);
                },
                onUploadTick: async (percentage) => {
                    console.log(percentage);
                    await delay(2);
                }
            }, list[0].file);
        }, extension);
    });
}