from prometheus_api_client import PrometheusConnect
import os


prom_host = os.environ['PROM_HOST']
prom_port = os.environ['PROM_PORT']

prom_url = "http://" + prom_host + ":" + prom_port

pc = PrometheusConnect(url=prom_url, disable_ssl=True)

