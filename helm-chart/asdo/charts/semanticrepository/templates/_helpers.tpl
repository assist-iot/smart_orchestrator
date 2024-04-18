{{/*
Expand the name of the chart.
*/}}
{{- define "enabler.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "enabler.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "enabler.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Name of the component backend.
*/}}
{{- define "backend.name" -}}
{{- printf "%s-backend" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component backend name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "backend.fullname" -}}
{{- printf "%s-backend" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component backend labels
*/}}
{{- define "backend.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "backend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component backend selector labels
*/}}
{{- define "backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: backend
isMainInterface: "yes"
tier: {{ .Values.backend.tier }}
{{- end }}

{{/*
Name of the component mongodb.
*/}}
{{- define "mongodb.name" -}}
{{- printf "%s-mongodb" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component mongodb name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "mongodb.fullname" -}}
{{- printf "%s-mongodb" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the default FQDN for mongodb headless service.
*/}}
{{- define "mongodb.svc.headless" -}}
{{- printf "%s-headless" (include "mongodb.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the URL to connect to the database.
*/}}
{{- define "mongodb.url" -}}
{{- print "mongodb://root:" .Values.mongodb.envVars.mongoRootPassword "@" (include "mongodb.fullname" .) ":" .Values.mongodb.service.port "/?serverSelectionTimeoutMS=500&replicaSet=" .Values.mongodb.envVars.mongoReplicaSet }}
{{- end }}

{{/*
Component mongodb labels
*/}}
{{- define "mongodb.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "mongodb.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component mongodb selector labels
*/}}
{{- define "mongodb.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: mongodb
isMainInterface: "no"
tier: {{ .Values.mongodb.tier }}
{{- end }}

{{/*
Name of the component minio.
*/}}
{{- define "minio.name" -}}
{{- printf "%s-minio" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component minio name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "minio.fullname" -}}
{{- printf "%s-minio" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the default FQDN for minio headless service.
*/}}
{{- define "minio.svc.headless" -}}
{{- printf "%s-headless" (include "minio.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the URL to connect to minIO.
*/}}
{{- define "minio.url" -}}
{{- print "http://" (include "minio.fullname" .) ":" .Values.minio.service.port }}
{{- end }}

{{/*
Component minio labels
*/}}
{{- define "minio.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "minio.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component minio selector labels
*/}}
{{- define "minio.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: minio
isMainInterface: "no"
tier: {{ .Values.minio.tier }}
{{- end }}

