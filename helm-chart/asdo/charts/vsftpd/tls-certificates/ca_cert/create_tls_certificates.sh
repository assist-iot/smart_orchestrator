#!/bin/bash

# openssl genrsa -out ca.key 2048

# openssl req -new -x509 -days 3650 -key ca.key -out ca.crt -subj "/C=ES/ST=Valencia/L=Valencia/O=UPV/OU=SATRD/CN=vsftpdserver"

openssl genrsa -out tls.key 2048

openssl req -new -key tls.key -out tls.csr -subj "/C=ES/ST=Valencia/L=Valencia/O=UPV/OU=SATRD/CN=tls.satrd.es"

openssl x509 -req -days 3650 -in tls.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out tls.crt

openssl verify -CAfile ca.crt tls.crt

echo ""
echo "CA cert base64"

base64 -w 0 ca.crt

echo ""
echo "TLS cert base64"

base64 -w 0 tls.crt

echo ""
echo "TLS key base64"

base64 -w 0 tls.key