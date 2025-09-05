import { BatchDefinition } from "./BatchDefinition";


export class BatchInstallation {

    #name:string;
    #packages:BatchDefinition[];

    public get name(): string {
        return this.#name;
    }

    public get packages(): BatchDefinition[] {
        return this.#packages;
    }

    public set packages(value: BatchDefinition[]) {
        this.#packages = value;
    }

    toJSON():object{
        return {
            name:this.#name,
            packages:this.#packages.map(p => p.toJSON())
        }
    }

    
    
}