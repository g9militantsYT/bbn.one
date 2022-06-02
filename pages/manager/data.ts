export function RecordToForm(formData: FormData, prefix: string, data: (Record<string, string | undefined> & { id: string })[]) {
    data.forEach(entry => {
        formData.append(prefix, entry.id)
        for (const [ key, value ] of Object.entries(entry)) {
            if (key == "id") continue;
            if (value)
                formData.set(`${prefix}-${entry.id}-${key}`, value);
        }
    })

    return formData;
}

export function FormToRecord<list extends string>(formData: FormData, prefix: string, finder: list[]): ({ id: string } & { [ type in list ]: string })[] {
    const idlist = formData.getAll(prefix + "s")
    const list = [];
    for (const id of idlist) {
        const entry: Record<string, string> & { id: string } = { id: id.toString() };
        for (const key of finder) {
            if (formData.has(`${prefix}-${id}-${key}`))
                // @ts-ignore Its fine
                entry[ key ] = formData.get(`${prefix}-${id}-${key}`)

        }
        list.push(entry);
    }
    // deno-lint-ignore no-explicit-any
    return list as any;
}