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
Name of the component kafka.
*/}}
{{- define "kafka.name" -}}
{{- printf "%s-kafka" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component kafka name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "kafka.fullname" -}}
{{- printf "%s-kafka" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component kafka labels.
*/}}
{{- define "kafka.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "kafka.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component kafka selector labels.
*/}}
{{- define "kafka.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: kafka
isMainInterface: "yes"
tier: {{ .Values.kafka.tier }}
{{- end }}

{{/*
Return the Kafka Listeners
*/}}
{{- define "kafka.listeners" -}}
{{- printf "INTERNAL_PLAINTEXT://%s:%d" (.Values.kafka.envVars.kafkaAdvertisedHost) (.Values.kafka.service.ports.kafka.port | int) -}}
{{- end -}}

{{/*
Return the Kafka Advertised Listeners
*/}}
{{- define "kafka.advertisedlisteners" -}}
{{- printf "INTERNAL_PLAINTEXT://%s:%d" ( include "kafka.fullname" . ) (.Values.kafka.service.ports.kafka.port | int) -}}
{{- end -}}

{{/*
Name of the component zookeeper.
*/}}
{{- define "zookeeper.name" -}}
{{- printf "%s-zookeeper" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component zookeeper name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "zookeeper.fullname" -}}
{{- printf "%s-zookeeper" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component zookeeper labels.
*/}}
{{- define "zookeeper.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "zookeeper.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component zookeeper selector labels.
*/}}
{{- define "zookeeper.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: zookeeper
isMainInterface: "no"
tier: {{ .Values.zookeeper.tier }}
{{- end }}

{{/*
Return the zookeeper URI
*/}}
{{- define "zookeeper.uri" -}}
{{- printf "%s:%d" (include "zookeeper.fullname" .) (.Values.zookeeper.service.ports.zookeeper.port | int) -}}
{{- end -}}