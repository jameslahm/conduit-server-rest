declare namespace NodeJS {
    export interface ProcessEnv {
      HOST: string;
      PORT:string;
      SECRET:string;
      MONGODBURI:string;
    }
  }