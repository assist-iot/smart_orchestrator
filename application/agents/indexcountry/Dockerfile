FROM python:3.9.18-alpine3.18

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

CMD ["python", "indexing_per_country.py"]
