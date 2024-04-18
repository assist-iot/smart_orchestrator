import { IEnabler } from '@/interfaces/IEnabler';
import mongoose from 'mongoose';

const EnablerSchema = new mongoose.Schema(
  {
    uid:String,
    name: {
      type:String,
      unique:true
    },
    cluster: String,
    helmChart: String,
    status: String,
    description: String,
    version: String
  }
);

export default mongoose.model<IEnabler & mongoose.Document>('Enabler', EnablerSchema);
