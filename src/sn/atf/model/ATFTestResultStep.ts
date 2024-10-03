import { IATFTestResultStep } from "../interfaces/IATFTestResultStep";

export class ATFTestResultStep implements IATFTestResultStep {
    private _outputs: string;
    private _sys_id: string;
   

    get outputs(): string {
        return this._outputs;
    }

    set outputs(value: string) {
        this._outputs = value;
    }

    get sysId(): string {
        return this._sys_id;
    }

    set sysId(value: string) {
        this._sys_id = value;
    }

   
}