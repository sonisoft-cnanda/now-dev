

export class NowStringUtil{

    public static isStringEmpty(value) : boolean {
        return !(value !== undefined && value !== null && value !== "" && (value + "").trim() !== "");
    }
}