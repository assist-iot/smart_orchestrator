import { IRepo } from '@/interfaces/IRepo';
import mongoose from 'mongoose';

const RepoSchema = new mongoose.Schema(
  {
    uid:String,
    name: {
      type:String,
      unique:true
    },
    description: String,
    url:  {
      type:String,
      unique:true
    },
    auth: {
      type: Object,
      required: false
    },
    type: String,
    status: String

  }
);

export default mongoose.model<IRepo & mongoose.Document>('Repo', RepoSchema);
