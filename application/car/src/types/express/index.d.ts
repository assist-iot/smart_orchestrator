import { Document, Model } from 'mongoose';
import { ICluster } from '@/interfaces/ICluster';

declare global {
  namespace Models {    
    export type ClusterModel = Model<ICluster & Document>;
  }
}
