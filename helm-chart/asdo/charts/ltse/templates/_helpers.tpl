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
Cilium Multi-cluster global service annotations
*/}}
{{- define "globalServiceAnnotations" -}}
io.cilium/global-service: "true"
io.cilium/service-affinity: remote
{{- end }}

{{/*
Name of the component api.
*/}}
{{- define "api.name" -}}
{{- printf "%s-api" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component api name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "api.fullname" -}}
{{- printf "%s-api" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component api labels
*/}}
{{- define "api.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "api.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component api selector labels
*/}}
{{- define "api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: api
isMainInterface: "yes"
tier: {{ .Values.api.tier }}
{{- end }}

{{/*
Name of the component elastic.
*/}}
{{- define "elastic.name" -}}
{{- printf "%s-elastic" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component elastic name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "elastic.fullname" -}}
{{- printf "%s-elastic" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the default FQDN for elastic headless service.
*/}}
{{- define "elastic.svc.headless" -}}
{{- printf "%s-headless" (include "elastic.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Component elastic labels
*/}}
{{- define "elastic.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "elastic.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component elastic selector labels
*/}}
{{- define "elastic.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: elastic
isMainInterface: "no"
tier: {{ .Values.elastic.tier }}
{{- end }}

{{/*
Name of the component postgrest.
*/}}
{{- define "postgrest.name" -}}
{{- printf "%s-postgrest" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component postgrest name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "postgrest.fullname" -}}
{{- printf "%s-postgrest" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component postgrest labels
*/}}
{{- define "postgrest.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "postgrest.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component postgrest selector labels
*/}}
{{- define "postgrest.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: postgrest
isMainInterface: "no"
tier: {{ .Values.postgrest.tier }}
{{- end }}

{{/*
Return the Postgrest DB URI
*/}}
{{- define "postgrest.dburi" -}}
{{- printf "postgres://%s:%s@%s:%d/%s" .Values.postgresql.envVars.postgresUser .Values.postgresql.envVars.postgresPassword (include "postgresql.fullname" .) (.Values.postgresql.service.ports.postgresql.port | int) .Values.postgresql.envVars.postgresDb -}}
{{- end -}}

{{/*
Name of the component postgresql.
*/}}
{{- define "postgresql.name" -}}
{{- printf "%s-postgresql" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component postgresql name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "postgresql.fullname" -}}
{{- printf "%s-postgresql" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the default FQDN for postgresql headless service.
*/}}
{{- define "postgresql.svc.headless" -}}
{{- printf "%s-headless" (include "postgresql.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Component postgresql labels
*/}}
{{- define "postgresql.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "postgresql.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component postgresql selector labels
*/}}
{{- define "postgresql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: postgresql
isMainInterface: "no"
tier: {{ .Values.postgresql.tier }}
{{- end }}

