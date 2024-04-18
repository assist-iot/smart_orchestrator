export interface ICluster {
    uid: string;
    name: string;
    credentials: object;
    description: string;
    status: string;
    cloud: boolean;
    cni: string;
  }
  