from peewee import *
import os

database = os.environ['MYSQL_DATABASE']
user = os.environ['MYSQL_USER']
password = os.environ['MYSQL_PASSWORD']
host = os.environ['MYSQL_HOST']
port = int(os.environ['MYSQL_PORT'])

db = MySQLDatabase(database, user = user, password = password, host = host, port = port)

class cluster(Model):
    id = PrimaryKeyField()
    name = CharField()
    timestamp = DateTimeField()
    cpu = IntegerField()
    ram = IntegerField()
    traffic = FloatField()
    is_real = BooleanField(default=True)
    class Meta:
        database = db
