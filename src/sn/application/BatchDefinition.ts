

export class BatchDefinition {


       #id:string;
       #load_demo_data:boolean;
       #notes:string;
       #requested_customization_version:string;
       #requested_version:string;
       #type:string;

      public get id(): string {
        return this.#id;
      }

      public get load_demo_data(): boolean {
        return this.#load_demo_data;
      }

      public get notes(): string {
        return this.#notes;
      }

      public get requested_customization_version(): string {
        return this.#requested_customization_version;
      }

      public get requested_version(): string {
        return this.#requested_version;
      }

      public get type(): string {
        return this.#type;
      }

      public set id(value: string) {
        this.#id = value;
      }

      public set load_demo_data(value: boolean) {
        this.#load_demo_data = value;
      }

      public set notes(value: string) {
        this.#notes = value;
      }

      public set requested_customization_version(value: string) {
        this.#requested_customization_version = value;
      }

      public set requested_version(value: string) {
        this.#requested_version = value;
      }


      public  toJSON() : object{
        return {
            id: this.#id,
            load_demo_data: this.#load_demo_data,
            notes: this.#notes,
            requested_customization_version: this.#requested_customization_version,
            requested_version: this.#requested_version,
            type: this.#type
        };
      }
     

      public constructor(id:string, load_demo_data:boolean, notes:string, requested_customization_version:string, requested_version:string, type:string) {
        this.#id = id;
        this.#load_demo_data = load_demo_data;
        this.#notes = notes;
        this.#requested_customization_version = requested_customization_version;
        this.#requested_version = requested_version;
        this.#type = type;
      }
}