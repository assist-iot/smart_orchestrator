import { Container } from 'typedi';
import { Logger } from 'winston';
import RepoService from '../services/auxiliar/repoService';

const repoServiceInstance = Container.get(RepoService)

const checkRepoAndHelmChart = async (req, res, next) => {
  const Logger : Logger = Container.get('logger');
  try {
    Logger.info('💊 Middleware Check Repository and Helm Chart exist fired')
    let {helmChart} = req.body
    let [repository, helmChartName] = helmChart.split("/")

    //Check repository and helm chart
    let repositories = await repoServiceInstance.getRepositories()      
    let repoExists = repositories.data.filter(x => x.name === repository)
    if (!repoExists.length){ throw new Error(`The repository with name ${repository} does not exist`)}

    let chartsByRepo = await repoServiceInstance.getChartsByRepo(repoExists[0].uid)
    let helmChartExists = chartsByRepo.data.filter(x => x.Name === helmChartName)
    if (!helmChartExists.length ){ throw new Error(`The helmChart with name ${helmChartName} does not exist in repository ${repository}`)}

    req.body.repository = repoExists[0].url
    return next();
  } catch (e) {
    Logger.error('🔥 Error with Check Repository and Helm Chart exist');
    if ('response' in e){
      return res.status(400).json({code: 400,message: e.response.data.message})
    }else{
      return res.status(400).json({code: 400,message: e.message})
    }
  }
};

export default checkRepoAndHelmChart;
