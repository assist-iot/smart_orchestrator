import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../../config';
const fs = require('fs');
import FormData from 'form-data'; // Import FormData
const streamifier = require('streamifier');


const semRepoMicroservice = config.SEMREPOURI

@Service()
export default class SemRepoService {
  constructor(
  ) {}
    /**
   *Makes a query to the LTSE.
   * 
   * @param calibrationFile binary file to upload.
   * @param model String representing the calibration model to upload
   * @param version String representing the calibration version, for the final path
   * @returns Response from the LTSE microservice.
  */
   public async getModel(namespace) {
      try{   
         let data = await axios.get<JSON>(`${semRepoMicroservice}/${namespace}/`);
         return data.data;
      } catch (error) {
         throw error
      }
   }

   public async getNamespace() {
      try{   
         let data = await axios.get<JSON>(`${semRepoMicroservice}/`);
         return data.data;
      } catch (error) {
         throw error
      }
   }

   public async postCalibration(calibrationFile, model, version) {
      try {
           const formData = new FormData();
           formData.append('content', fs.createReadStream(calibrationFile.path),{
             filename: calibrationFile.originalname,
             contentType: calibrationFile.mimetype,
           });
           await axios.post(`${semRepoMicroservice}/firmware/${model}/${version}/content?format=cal&overwrite=1`, formData, {
             headers: formData.getHeaders(),
           });
     
            console.log('File upload complete!');
       } catch (error) {
         console.log(error)
         throw error;
       }
   }
   

   
   public async getVersions(model) {
      try{   
         if (model == undefined){
            return
         }
         let data = await axios.get<JSON>(`${semRepoMicroservice}/firmware/${model}`);
         return data.data
      } catch (error) {
         throw error
      }
   }

   public async postVersion(model, version) {
      try{   
         let data = await axios.post<JSON>(`${semRepoMicroservice}/firmware/${model}/${version}`);
         return data.data;
      } catch (error) {
         throw error
      }
   }

   public async postModel(namespace,model) {
      try{   
         let data = await axios.post<JSON>(`${semRepoMicroservice}/${namespace}/${model}`);
         return data.data;
      } catch (error) {
         throw error
      }
   }

   public async postNamespace(namespace) {
      try{   
         let data = await axios.post<JSON>(`${semRepoMicroservice}/${namespace}`);
         return data.data;
      } catch (error) {
         throw error
      }
   }

}

