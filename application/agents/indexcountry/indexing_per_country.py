# ONLY ONE ENTRY PER CAR CONSIDERED -> PER COUNTRY
import requests
import os
from datetime import datetime, timedelta

nox_threshold = os.getenv("THRESHOLD",60) # NOx
collection = os.getenv("CARINDEX","obm")
base_url = os.getenv("ELASTIC_URL","http://158.42.161.177:30741/nosql/api")
countries = ["France", "Estonia", "Ukraine", "Latvia", "Belarus", "Norway", "Lithuania", "Malta", "Czech Republic","Germany","Sweden","Denmark","Finland","Luxembourg","Belgium","North Macedonia","Albania","Kosovo","ES","Romania","Hungary","Italy","Slovakia","Poland","Ireland","United Kingdom","Greece","Austria","Netherlands","Switzerland","Serbia","Montenegro","Croatia","Slovenia","Bulgaria","Moldova","Bosnia and Herzegovina","Portugal","Iceland"]
#countries = ["france", "estonia", "ukraine", "latvia", "belarus", "norway", "lithuania", "malta","czech republic","germany","sweden","denmark","finland","luxembourg","belgium","north macedonia","albania","kosovo","spain","romania","hungary","italy","slovakia","poland","ireland","united kingdom","greece","austria","netherlands","switzerland","serbia","montenegro","croatia","slovenia","bulgaria","moldova","bosnia and herzegovina","portugal","iceland"]


# Get the current datetime
current_datetime = datetime.now()
# Calculate the datetime of one week -> made for year, so older entries are included
last_week_datetime = current_datetime - timedelta(hours=168*52) 
# Convert the datetime to a Unix timestamp
timestamp_last_week = int(last_week_datetime.timestamp())

def get_subfleet_list(base_url):
    query = {
        "size": 0,
        "aggs": {
            "unique_subfleet": {
                "terms": {
                    "field": "subfleet",
                    "size": 50
                }
            }
        }
    }
    response = requests.get(f"{base_url}/{collection}/_search", json=query)
    result = response.json()
    subfleet_list = [bucket["key"] for bucket in result['aggregations']['unique_subfleet']['buckets']]
    return subfleet_list

def get_country_object(countries, subfleet_list, threshold, base_url):
    data_country_numbers = {"all": {}}
    # data_year = {}
    for country in countries:
        for subfleet in subfleet_list:
            result_compliants = {}
            result_outliers = {}
            query_compliants = {
                "query": {
                    "bool": {
                        "must": [
                            { "term": { "country": country } },
                            { "term": { "subfleet": subfleet } },
                            { "range": {"timestamp":{"gte": timestamp_last_week}}},
                            { "range": {"NOx_mg_km_isc":{"lt": threshold}}}
                        ]
                    }
                }
            }
            query_outliers = {
                "query": {
                    "bool": {
                        "must": [
                            { "term": { "country": country } },
                            { "term": { "subfleet": subfleet } },
                            { "range": {"timestamp":{"gte": timestamp_last_week}}},
                            { "range": {"NOx_mg_km_isc":{"gte": threshold}}}
                        ]
                    }
                }
            }

            response_compliants = requests.get(f"{base_url}/{collection}/_count", json=query_compliants)
            result_compliants = response_compliants.json()
            response_outliers = requests.get(f"{base_url}/{collection}/_count", json=query_outliers)
            result_outliers = response_outliers.json()

            if subfleet not in data_country_numbers:
                data_country_numbers[subfleet] = {}
            if country not in data_country_numbers["all"]:   
                data_country_numbers["all"][country] = { "total":0, "outliers":0 }
            if country not in data_country_numbers[subfleet]:   
                data_country_numbers[subfleet][country] = { "total":result_compliants["count"] + result_outliers["count"], "outliers":result_outliers["count"] }
  
            data_country_numbers["all"][country]['outliers'] += result_outliers["count"]
            data_country_numbers["all"][country]['total'] += result_compliants["count"] + result_outliers["count"]

    return data_country_numbers


def update_or_create_document(index, id, document, base_url):
    url = f"{base_url}/{index}/_doc/{id}"
    response = requests.post(url, json=document)

    if response.status_code == 201 or response.status_code == 200:
        print(f"Document in index {index} with ID {id} updated or created successfully")
    else:
        print(f"Failed to update or create document in index {index} with ID {id}")
        print(response.json())


# MAIN
subfleet_list=get_subfleet_list(base_url)
data_country_numbers = get_country_object(countries, subfleet_list, nox_threshold, base_url)

for subfleet, subfleetData in data_country_numbers.items():
    Document = {  
        "subfleet": subfleet,
        "values": subfleetData
    }
    update_or_create_document("data_per_country", subfleet, Document, base_url)





