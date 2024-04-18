import { ICluster } from '@/interfaces/ICluster';
import mongoose from 'mongoose';

const ClusterSchema = new mongoose.Schema(
  {
    uid:String,
    name: {
      type:String,
      unique:true
    },
    credentials:{
      type:Object,
      unique:true
    },
    description:String,
    status:String,
    cloud:{
      type: Boolean,
      required: true,
      default: false,
      validate: {
        validator: async function(value) {
          if (value === true) {
            const count = await this.constructor.countDocuments({ cloud: true });
            return count < 1;
          }
          return true;
        },
        message: 'Only one cloud cluster'
      }
    },
    cni:String
  }
);

export default mongoose.model<ICluster & mongoose.Document>('Cluster', ClusterSchema);
