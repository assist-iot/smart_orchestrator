import { Document, Model } from 'mongoose';
import { IRepo } from '@/interfaces/IRepo';

declare global {
  namespace Models {    
    export type RepoModel = Model<IRepo & Document>;
  }
}
