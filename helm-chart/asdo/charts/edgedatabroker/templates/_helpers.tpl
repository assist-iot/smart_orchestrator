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
Cilium Multi-cluster global service annotations.
*/}}
{{- define "globalServiceAnnotations" -}}
io.cilium/global-service: "true"
io.cilium/service-affinity: remote
{{- end }}

{{/*
Name of the component vernemq.
*/}}
{{- define "vernemq.name" -}}
{{- printf "%s-vernemq" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component vernemq name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "vernemq.fullname" -}}
{{- printf "%s-vernemq" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the default FQDN for vernemq headless service.
*/}}
{{- define "vernemq.svc.headless" -}}
{{- printf "%s-headless" (include "vernemq.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Component vernemq labels.
*/}}
{{- define "vernemq.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "vernemq.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component vernemq selector labels.
*/}}
{{- define "vernemq.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: vernemq
isMainInterface: "yes"
tier: {{ .Values.vernemq.tier }}
{{- end }}

{{/*
Name of the component frscript.
*/}}
{{- define "frscript.name" -}}
{{- printf "%s-frscript" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component frscript name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "frscript.fullname" -}}
{{- printf "%s-frscript" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component frscript labels.
*/}}
{{- define "frscript.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "frscript.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component frscript selector labels.
*/}}
{{- define "frscript.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: frscript
isMainInterface: "no"
tier: {{ .Values.frscript.tier }}
{{- end }}

{{/*
Name of the component mqttexplorer.
*/}}
{{- define "mqttexplorer.name" -}}
{{- printf "%s-mqttexplorer" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component mqttexplorer name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "mqttexplorer.fullname" -}}
{{- printf "%s-mqttexplorer" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component mqttexplorer labels.
*/}}
{{- define "mqttexplorer.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "mqttexplorer.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component mqttexplorer selector labels.
*/}}
{{- define "mqttexplorer.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: mqttexplorer
isMainInterface: "no"
tier: {{ .Values.mqttexplorer.tier }}
{{- end }}

