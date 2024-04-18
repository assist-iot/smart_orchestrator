import os
import pandas as pd
from neuralprophet import NeuralProphet, set_log_level
from datetime import datetime, timedelta
from random import randint
from operator import itemgetter
from mysql_conf import *
from mongo_conf import *

def getResources(name,curr,hist):
  dataCPU = []
  dataRAM = []
  dataTraffic = []
  query = cluster.select().where((cluster.name==name) & (cluster.timestamp >= hist) & (cluster.timestamp < curr))
  for q in query:
    dataCPU.append([q.timestamp,q.cpu+randint(0,1)])
    dataRAM.append([q.timestamp,q.ram+randint(0,1)])
    dataTraffic.append([q.timestamp,q.traffic+randint(0,1)])
  return dataCPU,dataRAM,dataTraffic

def setMetrics(values):
  for val in values:
    try:
      f = cluster.get(
        (cluster.name == val['name']) & 
        (cluster.timestamp == val['timestamp']))
    except cluster.DoesNotExist:
      cluster.create(**val)
      continue
    up = cluster.update(**val).where(
      cluster.name==val['name'],
      cluster.timestamp==val['timestamp'],
      cluster.is_real == val['is_real']
    )
    up.execute()

def main():
  # Obtain clusters to predict
  clustersDB = clientDB['clusterDB'].clusters
  clusters = [cluster['name'] for cluster in clustersDB.find()]

  # Adding importation data timeline
  history_data = '1'
  future_data = '1'
  if "HISTORY_DATA" in os.environ: history_data = os.environ['HISTORY_DATA']
  if "FUTURE_DATA" in os.environ: future_data = os.environ['FUTURE_DATA']
     
  curr = datetime.now().replace(hour=0,minute=0, second=0, microsecond=0)
  hist = curr - timedelta(days=int(history_data))

  # Once we have the data to make the requests, we obtain the history of data from the assigned date until today at 00:00
  df = []
  for cluster in clusters:
      dataCPU,dataRAM,dataTraffic = getResources(cluster,curr,hist)
      # Parseamos los datos a un Pandas Dataframe
      df.append(pd.DataFrame(dataCPU,columns=['ds','y']))
      df.append(pd.DataFrame(dataRAM,columns=['ds','y']))
      df.append(pd.DataFrame(dataTraffic,columns=['ds','y']))
  if not df:
      return 'Train module not executed: insufficient data'
  
  #Now that the data is in the correct format, we can train and validate a NeuralProphet model
  p = int(future_data) * 96
  resources = []

  for data in df:
      data.drop_duplicates(subset='ds',keep='first', inplace=True)
      res = []
      m = NeuralProphet()
      metrics = m.fit(data,freq='15T')
      #Create forecast
      future = m.make_future_dataframe(data, periods=p)
      forecast = m.predict(future)
      res.append(forecast['yhat1'].tolist())
      res.append(forecast['ds'].tolist())
      resources.append(res)
  
  data = []
  for i in range(0,len(resources),3):
      for j in range(len(resources[i][0])):
        dict = {
            'name' : clusters[int(i/3)],
            'timestamp': resources[i][1][j].to_pydatetime(),
            'cpu' : max(0,int(resources[i][0][j])),
            'ram' : max(0,int(resources[i+1][0][j])),
            'traffic' : max(0,int(resources[i+2][0][j])),
            'is_real' : 0
        }
        data.append(dict)

  sorted_data = sorted(data, key=itemgetter('timestamp'))
  print(sorted_data)
  setMetrics(sorted_data)
  return 'Train module executed successfully'


if __name__ == "__main__":
    main()