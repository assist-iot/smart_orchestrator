import { Document, Model } from 'mongoose';
import { IEnabler } from '@/interfaces/IEnabler';

declare global {
  namespace Models {    
    export type EnablerModel = Model<IEnabler & Document>;
  }
}
