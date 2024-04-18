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
Return the asdo Init Container
*/}}
{{- define "asdo.initContainerCommand" -}}
{{- printf "until (nc -zvw1  %s %d); do sleep 3; done; exit 0" (include "db.fullname" .) (.Values.db.service.ports.db.port | int) -}}
{{- end -}}

{{/*
Return the mqtt Init Container
*/}}
{{- define "mqtt.initContainerCommand" -}}
{{- printf "until (nc -zvw1  %s %d); do sleep 3; done; exit 0" (include "vernemq.fullname" .Subcharts.edgedatabroker) (.Values.car.envVars.mqttPort | int) -}}
{{- end -}}

{{/*
Return the mqtt Init Container
*/}}
{{- define "ft.initContainerCommand" -}}
{{- printf "until (nc -zvw1  %s %d); do sleep 3; done; exit 0" (include "kafka.fullname" .Subcharts.ft) (.Values.ftedb.envVars.ftPort | int) -}}
{{- end -}}

{{/*
Return the ftltse Init Container
*/}}
{{- define "ftltse.initContainerCommand" -}}
{{- printf "until (nc -zvw1  %s %d); do sleep 3; done; exit 0" (include "ftltse.fullname" .) (.Values.ftltse.job.service.ports.job.port | int) -}}
{{- end -}}

{{/*
Return the ftltse Init Container
*/}}
{{- define "mysql.initContainerCommand" -}}
{{- printf "until (nc -zvw1  %s %d); do sleep 3; done; exit 0" (include "mysql.fullname" .) (.Values.scheduler.prediction.mysql.service.ports.mysql.port | int) -}}
{{- end -}}


{{/*
Name of the component apigateway.
{{- define "apigateway.name" -}}
{{- printf "%s-apigateway" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component apigateway name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "apigateway.fullname" -}}
{{- printf "%s-apigateway" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component apigateway labels.
*/}}
{{- define "apigateway.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "apigateway.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component apigateway selector labels.
*/}}
{{- define "apigateway.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: apigateway
isMainInterface: "yes"
tier: {{ .Values.apigateway.tier }}
{{- end }}


{{/*
Name of the component cluster.
*/}}
{{- define "cluster.name" -}}
{{- printf "%s-cluster" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component cluster name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "cluster.fullname" -}}
{{- printf "%s-cluster" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component cluster labels.
*/}}
{{- define "cluster.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "cluster.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component cluster selector labels.
*/}}
{{- define "cluster.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: cluster
isMainInterface: "no"
tier: {{ .Values.cluster.tier }}
{{- end }}

{{/*
Return the Cluster URI
*/}}
{{- define "cluster.mongoUri" -}}
{{- printf "mongodb://%s/clusterDB" (include "db.fullname" .) -}}
{{- end -}}

{{/*
Return the cluster URI
*/}}
{{- define "cluster.uri" -}}
{{- printf "http://%s:%d" (include "cluster.fullname" .) (.Values.cluster.service.ports.cluster.port | int) -}}
{{- end -}}


{{/*
Name of the component enabler.
*/}}
{{- define "enablers.name" -}}
{{- printf "%s-enablers" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component enablers name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "enablers.fullname" -}}
{{- printf "%s-enablers" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Component enablers labels.
*/}}
{{- define "enablers.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "enablers.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component enablers selector labels.
*/}}
{{- define "enablers.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enablers.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: enablers
isMainInterface: "no"
tier: {{ .Values.enablers.tier }}
{{- end }}

{{/*
Return the Cluster DB URI
*/}}
{{- define "enablers.mongoUri" -}}
{{- printf "mongodb://%s/enablerDB" (include "db.fullname" .) -}}
{{- end -}}

{{/*
Return the Enabler URI
*/}}
{{- define "enablers.uri" -}}
{{- printf "http://%s:%d" (include "enablers.fullname" .) (.Values.enablers.service.ports.enablers.port | int) -}}
{{- end -}}


{{/*
Name of the component repository.
*/}}
{{- define "repository.name" -}}
{{- printf "%s-repository" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component repository name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "repository.fullname" -}}
{{- printf "%s-repository" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component repository labels.
*/}}
{{- define "repository.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "repository.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component repository selector labels.
*/}}
{{- define "repository.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: repository
isMainInterface: "no"
tier: {{ .Values.repository.tier }}
{{- end }}

{{/*
Return the Repository URI
*/}}
{{- define "repository.uri" -}}
{{- printf "http://%s:%d" (include "repository.fullname" .) (.Values.repository.service.ports.repo.port | int) -}}
{{- end -}}

{{/*
Return the Cluster DB URI
*/}}
{{- define "repository.mongoUri" -}}
{{- printf "mongodb://%s/repoDB" (include "db.fullname" .) -}}
{{- end -}}

{{/*
Name of the component helm.
*/}}
{{- define "helm.name" -}}
{{- printf "%s-helm" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component helm name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "helm.fullname" -}}
{{- printf "%s-helm" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component helm labels.
*/}}
{{- define "helm.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "helm.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component helm selector labels.
*/}}
{{- define "helm.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: helm
isMainInterface: "no"
tier: {{ .Values.helm.tier }}
{{- end }}

{{/*
Return the Helm URI
*/}}
{{- define "helm.uri" -}}
{{- printf "http://%s:%d" (include "helm.fullname" .) (.Values.helm.service.ports.helm.port | int) -}}
{{- end -}}


{{/*
Name of the component scheduler.
*/}}
{{- define "scheduler.name" -}}
{{- printf "%s-scheduler" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component scheduler name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "scheduler.fullname" -}}
{{- printf "%s-scheduler" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component scheduler labels.
*/}}
{{- define "scheduler.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "scheduler.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component scheduler selector labels.
*/}}
{{- define "scheduler.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: scheduler
isMainInterface: "no"
tier: {{ .Values.scheduler.tier }}
{{- end }}

{{/*
Return the scheduler URI
*/}}
{{- define "scheduler.uri" -}}
{{- printf "http://%s:%d" (include "scheduler.fullname" .) (.Values.scheduler.service.ports.scheduler.port | int) -}}
{{- end -}}


{{/*
Name of the component multiclusterservice.
*/}}
{{- define "multiclusterservice.name" -}}
{{- printf "%s-multiclusterservice" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component multiclusterservice name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "multiclusterservice.fullname" -}}
{{- printf "%s-multiclusterservice" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component multiclusterservice labels.
*/}}
{{- define "multiclusterservice.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "multiclusterservice.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component multiclusterservice selector labels.
*/}}
{{- define "multiclusterservice.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: multiclusterservice
isMainInterface: "no"
tier: {{ .Values.multiclusterservice.tier }}
{{- end }}

{{/*
Name of the component db.
*/}}
{{- define "db.name" -}}
{{- printf "%s-db" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component db name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "db.fullname" -}}
{{- printf "%s-db" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the default FQDN for db headless service.
*/}}
{{- define "db.svc.headless" -}}
{{- printf "%s-headless" (include "db.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Component db labels.
*/}}
{{- define "db.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "db.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component db selector labels.
*/}}
{{- define "db.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: db
isMainInterface: "no"
tier: {{ .Values.db.tier }}
{{- end }}

{{/*
Name of the component cluster.
*/}}
{{- define "car.name" -}}
{{- printf "%s-car" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component car name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "car.fullname" -}}
{{- printf "%s-car" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component car labels.
*/}}
{{- define "car.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "car.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component car selector labels.
*/}}
{{- define "car.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: car
isMainInterface: "no"
tier: {{ .Values.car.tier }}
{{- end }}

{{/*
Return the car URI
*/}}
{{- define "car.uri" -}}
{{- printf "http://%s:%d" (include "car.fullname" .) (.Values.car.service.ports.car.port | int) -}}
{{- end -}}

{{/*
Return the fiware URI
*/}}
{{- define "fiware.uri" -}}
{{- printf "http://%s:%d/v2" (include "orion.fullname" .Subcharts.orion ) (.Values.car.envVars.fiwarePort | int) -}}
{{- end -}}


{{/*
Name of the ftedb cluster.
*/}}
{{- define "ftedb.name" -}}
{{- printf "%s-ftedb" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component ftedb name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "ftedb.fullname" -}}
{{- printf "%s-ftedb" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component ftedb labels.
*/}}
{{- define "ftedb.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "ftedb.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component ftedb selector labels.
*/}}
{{- define "ftedb.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: ftedb
isMainInterface: "no"
tier: {{ .Values.ftedb.tier }}
{{- end }}

{{/*
Name of the component ftngsi.
*/}}
{{- define "ftngsi.name" -}}
{{- printf "%s-ftngsi" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component ftngsi name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "ftngsi.fullname" -}}
{{- printf "%s-ftngsi" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component ftngsi labels.
*/}}
{{- define "ftngsi.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "ftngsi.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component ftngsi selector labels.
*/}}
{{- define "ftngsi.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: ftngsi
isMainInterface: "no"
tier: {{ .Values.ftngsi.tier }}
{{- end }}

{{/*
Name of the component cluster.
*/}}
{{- define "ftltse.name" -}}
{{- printf "%s-ftltse" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component ftltse name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "ftltse.fullname" -}}
{{- printf "%s-ftltse" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component ftltse labels.
*/}}
{{- define "ftltse.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "ftltse.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component ftltse selector labels.
*/}}
{{- define "ftltse.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: ftltse
isMainInterface: "no"
tier: {{ .Values.ftltse.tier }}
{{- end }}

{{/*
Return the cluster URI
*/}}
{{- define "ft.uri" -}}
{{- printf "%s:%d" (include "kafka.fullname" .Subcharts.ft) (.Values.ftltse.envVars.ftPort | int) -}}
{{- end -}}

{{/*
Return the cluster URI
*/}}
{{- define "ftltse.uri" -}}
{{- printf "http://%s:%d/connectors" (include "ftltse.fullname" .) (.Values.ftltse.service.ports.ftltse.port | int) -}}
{{- end -}}

{{/*
Name of the component cluster.
*/}}
{{- define "ftltsejob.name" -}}
{{- printf "%s-ftltsejob" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component ftltsejob name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "ftltsejob.fullname" -}}
{{- printf "%s-ftltsejob" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component ftltsejob labels.
*/}}
{{- define "ftltsejob.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "ftltsejob.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component ftltsejob selector labels.
*/}}
{{- define "ftltsejob.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: ftltse
isMainInterface: "no"
tier: {{ .Values.ftltse.job.tier }}
{{- end }}

{{/*
Name of the component mysql.
*/}}
{{- define "mysql.name" -}}
{{- printf "%s-mysql" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component mysql name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "mysql.fullname" -}}
{{- printf "%s-mysql" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component mysql labels.
*/}}
{{- define "mysql.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "mysql.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component mysql selector labels.
*/}}
{{- define "mysql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: mysql
isMainInterface: "no"
tier: {{ .Values.scheduler.prediction.mysql.tier }}
{{- end }}

{{/*
Create the default FQDN for mysql headless service.
*/}}
{{- define "mysql.svc.headless" -}}
{{- printf "%s-headless" (include "mysql.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Name of the component mysql.
*/}}
{{- define "mc.name" -}}
{{- printf "%s-mc" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component mc name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "mc.fullname" -}}
{{- printf "%s-mc" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component mc labels.
*/}}
{{- define "mc.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "mc.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component mc selector labels.
*/}}
{{- define "mc.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: mc
isMainInterface: "no"
tier: {{ .Values.scheduler.prediction.mc.tier }}
{{- end }}

{{/*
Name of the component mysql.
*/}}
{{- define "tm.name" -}}
{{- printf "%s-tm" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component tm name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "tm.fullname" -}}
{{- printf "%s-tm" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Component tm labels.
*/}}
{{- define "tm.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "tm.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component tm selector labels.
*/}}
{{- define "tm.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: tm
isMainInterface: "no"
tier: {{ .Values.scheduler.prediction.tm.tier }}
{{- end }}

{{/*
Name of the component cluster.
*/}}
{{- define "pilot.name" -}}
{{- printf "%s-pilot" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component pilot name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "pilot.fullname" -}}
{{- printf "%s-pilot" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Component pilot labels.
*/}}
{{- define "pilot.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "pilot.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component pilot selector labels.
*/}}
{{- define "pilot.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: pilot
isMainInterface: "no"
tier: {{ .Values.pilot.tier }}
{{- end }}

{{/*
Return the ltse URI
*/}}
{{- define "ltse.uri" -}}
{{- printf "http://%s:%d/nosql/api" (include "api.fullname" .Subcharts.ltse) (.Values.pilot.envVars.ltsePort | int) -}}
{{- end -}}

{{/*
Return the semrepo URI
*/}}
{{- define "semrepo.uri" -}}
{{- printf "http://%s:%d/v1/m" (include "backend.fullname" .Subcharts.semanticrepository) (.Values.pilot.envVars.semRepoPort | int) -}}
{{- end -}}

{{/*
Name of the component cluster.
*/}}
{{- define "fluentd.name" -}}
{{- printf "%s-fluentd" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified component fluentd name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "fluentd.fullname" -}}
{{- printf "%s-fluentd" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Component fluentd labels.
*/}}
{{- define "fluentd.labels" -}}
helm.sh/chart: {{ include "enabler.chart" . }}
{{ include "fluentd.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Component fluentd selector labels.
*/}}
{{- define "fluentd.selectorLabels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: fluentd
isMainInterface: "no"
tier: {{ .Values.fluentd.tier }}
{{- end }}

{{/*
Name of the cronjob indexcountry.
*/}}
{{- define "indexcountry.name" -}}
{{- printf "%s-cronjob-indexcountry" (include "enabler.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified cronjob indexcountry name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "indexcountry.fullname" -}}
{{- printf "%s-cronjob-indexcountry" (include "enabler.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
cronjob indexcountry labels.
*/}}
{{- define "indexcountry.labels" -}}
app.kubernetes.io/name: {{ include "enabler.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
enabler: {{ .Chart.Name }}
app.kubernetes.io/component: indexcountry
isMainInterface: "no"
tier: internal
helm.sh/chart: {{ include "enabler.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}