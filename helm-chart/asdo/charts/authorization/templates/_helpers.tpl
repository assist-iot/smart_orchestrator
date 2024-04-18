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
Name of the component authzweb.
*/}}
{{- define "authzweb.name" -}}
{{- printf "%s-authzweb" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component authzweb name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "authzweb.fullname" -}}
{{- printf "%s-authzweb" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component authzweb labels
*/}}
{{- define "authzweb.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "authzweb.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component authzweb selector labels
*/}}
{{- define "authzweb.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: authzweb
isMainInterface: "yes"
tier: {{ .Values.authzweb.tier }}
{{- end }}

{{/*
Name of the component authzdatabase.
*/}}
{{- define "authzdatabase.name" -}}
{{- printf "%s-authzdatabase" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component authzdatabase name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "authzdatabase.fullname" -}}
{{- printf "%s-authzdatabase" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the default FQDN for authzdatabase headless service.
*/}}
{{- define "authzdatabase.svc.headless" -}}
{{- printf "%s-headless" (include "authzdatabase.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Component authzdatabase labels
*/}}
{{- define "authzdatabase.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "authzdatabase.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component authzdatabase selector labels
*/}}
{{- define "authzdatabase.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: authzdatabase
isMainInterface: "no"
tier: {{ .Values.authzdatabase.tier }}
{{- end }}

