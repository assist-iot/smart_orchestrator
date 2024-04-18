package main

import (
	"fmt"
	"net/http"
	"sync"
	"io/ioutil"
	"os"
	"strings"
	"time"
	"encoding/json"
	"strconv"
	"context"

	"github.com/gin-gonic/gin"
	"github.com/go-errors/errors"

	"helm.sh/helm/v3/pkg/repo"
	"helm.sh/helm/v3/pkg/getter"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/cmd/helm/search"
	"github.com/Masterminds/semver/v3"
	"path/filepath"
	"helm.sh/helm/v3/pkg/helmpath"

	"auxiliar/history"
	"auxiliar/install"
	localvalues "auxiliar/values"
	localrepo "auxiliar/repo"

)

var repoDir = os.Getenv("REPO_DIR")
var cacheDir = os.Getenv("CACHE_DIR")

func main() {
	_, err := os.Stat(repoDir)
	if err == nil {
		fmt.Println("El archivo", repoDir, "ya existe.")
	}else{
		file, err := os.Create(repoDir)
		if err != nil {
			fmt.Println("Error al crear el archivo:", err)
			return
		}
		defer file.Close()
	}


	r := gin.Default()
    r.Use(ErrorHandler())

	//Repos routes
	r.POST("/repos/public/", helmAddPublicRepo)
	r.POST("/repos/private/", helmAddPrivateRepo)
	r.POST("/repos/update/", updateCharts)
	r.DELETE("/repos/:repository", helmDeleteRepo)
	
	//Enabler routes
	r.GET("/enabler/history/:enabler", historyHelmChart)
	r.GET("/enabler/values/", showValuesHelmChart)
	r.GET("/enabler/", listHelmChartEnabled)
	r.GET("/enabler/repo/:repository", listHelmChartByRepo)
	r.POST("/enabler/install", installHelmChart)
	r.POST("/enabler/upgrade/", upgradeHelmChart)
	r.POST("/enabler/rollback/", rollbackHelmChart)
	r.DELETE("/enabler/uninstall/:enabler", uninstallHelmChart)

	r.Run(":9888") // listen and serve on 0.0.0.0:8080
}

func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next() // Execute the next middleware and route handler

        err := c.Errors.Last()
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"msg": err.Error()})
            c.Abort()
        }
    }
}

/*************** Repositories *****************/

func helmAddPublicRepo(g *gin.Context){
	var req localrepo.PublicRepo

	err := g.ShouldBindJSON(&req)
	if err != nil {
		g.Error(errors.New("Not valid JSON"))
		return	
	}

	r := repo.Entry{
		Name: req.Name,
		URL:  req.URL,
	}

	f, err := repo.LoadFile(repoDir)
	if err != nil {
		g.Error(errors.New("Can not open repository file"))
		return
	}
	
	get := f.Get(req.Name)
	if get != nil {
		g.Error(errors.New("Repository with name " + req.Name + " already exists"))
		return
	}

	if strings.Contains(req.Name, "/") {
		g.Error(errors.New("Repository name " + req.Name + " contains '/', please specify a different name without '/'"))
		return
	}

	s, err := repo.NewChartRepository(&r, getter.All(&cli.EnvSettings{
		RepositoryConfig: repoDir,
		RepositoryCache:  cacheDir,
	}))
	if err != nil {
		return
	}

	if _, err := s.DownloadIndexFile(); err != nil {
		g.Error(errors.New("looks like "+ req.URL +" is not a valid chart repository or cannot be reached"))
		return
	}

	f.Update(&r)

	if err := f.WriteFile(repoDir, 0644); err != nil {
		fmt.Printf("Error al guardar el archivo de configuración: %s", err)
		return
	}

	g.JSON(http.StatusOK, gin.H{
		"message": "The repository was added succesfully",
	})
}

func helmAddPrivateRepo(g *gin.Context){
	var req localrepo.PrivateRepo

	err := g.ShouldBindJSON(&req)
	if err != nil {
		g.Error(errors.New("Not valid JSON"))
		return	
	}

	r := repo.Entry{
		Name: req.Name,
		URL: req.URL,
		Username: req.Username,
		Password: req.Password,
	}

	f, err := repo.LoadFile(repoDir)
	if err != nil {
		g.Error(errors.New("Can not open repository file"))
		return
	}
	
	get := f.Get(req.Name)
	if get != nil {
		g.Error(errors.New("Repository with name " + req.Name + " already exists"))
		return
	}

	if strings.Contains(req.Name, "/") {
		g.Error(errors.New("Repository name " + req.Name + " contains '/', please specify a different name without '/'"))
		return
	}

	s, err := repo.NewChartRepository(&r, getter.All(&cli.EnvSettings{
		RepositoryConfig: repoDir,
		RepositoryCache:  cacheDir,
	}))
	if err != nil {
		return
	}

	if _, err := s.DownloadIndexFile(); err != nil {
		fmt.Printf("entro")
		g.Error(errors.New("looks like "+ req.URL +" is not a valid chart repository or cannot be reached"))
		return
	}

	f.Update(&r)

	if err := f.WriteFile(repoDir, 0644); err != nil {
		fmt.Printf("Error al guardar el archivo de configuración: %s", err)
		return
	}

	g.JSON(http.StatusOK, gin.H{
		"message": "The repository was added succesfully",
	})
}

func helmDeleteRepo(g *gin.Context){

	repository := g.Param("repository")

	f, err := repo.LoadFile(repoDir)
	if err != nil {
		g.Error(errors.New("Can not open repository file"))
		return
	}

	f.Remove(repository)
	
	if err := f.WriteFile(repoDir, 0644); err != nil {
		fmt.Printf("Error al guardar el archivo de configuración: %s", err)
	}

	if err := localrepo.RemoveRepoCache(cacheDir, repository); err != nil {
		g.Error(errors.New("Can't remove index file"))
		return
	}

	g.JSON(http.StatusOK, gin.H{
		"message": "The repository was removed succesfully",
	})
}

func updateCharts(g *gin.Context){
	fmt.Printf("Hang tight while we grab the latest from your chart repositories...")
	f, err := repo.LoadFile(repoDir)
	if err != nil {
		g.Error(errors.New("Repository directory does not exist"))
		return 
	}
	var repos []*repo.ChartRepository

	for _, cfg := range f.Repositories {
		r, err := repo.NewChartRepository(cfg, getter.All(&cli.EnvSettings{
			RepositoryConfig: repoDir,
			RepositoryCache:  cacheDir,
		}))
		if err != nil {
			g.Error(errors.New("Error getting the repositories"))
			return 
		}
		repos = append(repos, r)
	}

	var wg sync.WaitGroup
	var repoFailList []string
	for _, re := range repos {
		wg.Add(1)
		go func(re *repo.ChartRepository) {
			defer wg.Done()
			if _, err := re.DownloadIndexFile(); err != nil {
				fmt.Printf("...Unable to get an update from the %q chart repository (%s):\n\t%s\n", re.Config.Name, re.Config.URL, err)
				repoFailList = append(repoFailList, re.Config.Name)
			} else {
				fmt.Printf("...Successfully got an update from the %q chart repository\n", re.Config.Name)
			}
		}(re)
	}
	wg.Wait()
	resultado := strings.Join(repoFailList, " ")

	//Probar si un repositorio ya no existe
	if len(resultado)>0 {
		g.Error(errors.New("Error updating the repositories [" + resultado + "]"))
		return 
	}

	g.JSON(http.StatusOK, gin.H{
		"message": "Update Completed",
	})
}

/*************** Enablers *****************/

func installHelmChart(g *gin.Context) {
	
	version := g.GetHeader("Version")
	releaseName := g.GetHeader("Release-Name")
	chart := g.GetHeader("Chart")
	timeoutHeader := g.GetHeader("Timeout")

	var settings = install.Settings

	body, err := ioutil.ReadAll(g.Request.Body)
	currentMap :=  map[string]interface{}{}
	if err := json.Unmarshal([]byte(string(body)), &currentMap); err != nil {
		g.Error(errors.New(err))
		return
	}

	kubeconfig := currentMap["credentials"]
	valuesData := currentMap["values"]
	if err := install.CreateKubeConfig(kubeconfig); err != nil {
		g.Error(errors.New(err))
		return
	}
	valueOpts, err := install.CreateValues(valuesData)
	if err != nil {
		g.Error(errors.New(err))
		return
	}

	timeout,err := strconv.Atoi(timeoutHeader)
	if err != nil || timeoutHeader == "" {
		timeout = 120
		fmt.Printf("Default timeout set to 1 minutes")
	}

	args := []string{releaseName, chart}

	// Helm Code
	actionConfig := new(action.Configuration)
	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(settings.RESTClientGetter(), settings.Namespace(), helmDriver, install.Debug); err != nil {
		panic(err.Error())
	}
	client := action.NewInstall(actionConfig)
	client.Wait = true
	client.Timeout = time.Duration(timeout) * time.Second
	client.Version = version
	
	registryClient, err := install.NewRegistryClient(client.CertFile, client.KeyFile, client.CaFile, client.InsecureSkipTLSverify)
	if err != nil {
		fmt.Printf("missing registry client:")
	}

	client.SetRegistryClient(registryClient)
	rel, err := install.RunInstall(args, client, valueOpts)
	_ = rel 
	if err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("INSTALLATION FAILED")
		return
	}
	g.JSON(http.StatusOK, gin.H{
		"message": "The enabler was added succesfully",
		"version": rel.Chart.Metadata.Version,
	})
}

func uninstallHelmChart(g *gin.Context) {
	enabler := g.Param("enabler")

	var settings = install.Settings

	body, err := ioutil.ReadAll(g.Request.Body)
	currentMap :=  map[string]interface{}{}
	if err := json.Unmarshal([]byte(string(body)), &currentMap); err != nil {
		g.Error(errors.New(err))
		return
	}

	kubeconfig := currentMap["credentials"]
	if err := install.CreateKubeConfig(kubeconfig); err != nil {
		g.Error(errors.New(err))
		return
	}

	timeoutHeader := g.GetHeader("Timeout")
	timeout,err := strconv.Atoi(timeoutHeader)
	if err != nil || timeoutHeader == "" {
		timeout = 120
		fmt.Printf("Default timeout set to 1 minute")
	}

	// Helm Code
	actionConfig := new(action.Configuration)
	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(settings.RESTClientGetter(), settings.Namespace(), helmDriver, install.Debug); err != nil {
		panic(err.Error())
	}
	client := action.NewUninstall(actionConfig)
	client.Wait = true
	client.Timeout = time.Duration(timeout) * time.Second
	
	res, err := client.Run(enabler)
	_ = res
	if err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("UNINSTALLATION FAILED")
		return
	}
	g.JSON(http.StatusOK, gin.H{
		"message": "The enabler was deleted succesfully",
	})
}

func upgradeHelmChart(g *gin.Context) {
	
	version := g.GetHeader("Version")
	releaseName := g.GetHeader("Release-Name")
	chart := g.GetHeader("Chart")
	timeoutHeader := g.GetHeader("Timeout")
	
	var settings = install.Settings

	body, err := ioutil.ReadAll(g.Request.Body)
	currentMap :=  map[string]interface{}{}
	if err := json.Unmarshal([]byte(string(body)), &currentMap); err != nil {
		g.Error(errors.New(err))
		return
	}

	kubeconfig := currentMap["credentials"]
	if err := install.CreateKubeConfig(kubeconfig); err != nil {
		g.Error(errors.New(err))
		return
	}
	valuesData := currentMap["values"]
	if err := install.CreateKubeConfig(kubeconfig); err != nil {
		g.Error(errors.New(err))
		return
	}
	valueOpts, err := install.CreateValues(valuesData)
	if err != nil {
		g.Error(errors.New(err))
		return
	}

	timeout,err := strconv.Atoi(timeoutHeader)
	if err != nil || timeoutHeader == "" {
		timeout = 120
		fmt.Printf("Default timeout set to 1 minute")
	}

	// Helm Code
	actionConfig := new(action.Configuration)
	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(settings.RESTClientGetter(), settings.Namespace(), helmDriver, install.Debug); err != nil {
		panic(err.Error())
	}
	client := action.NewUpgrade(actionConfig)

	client.Namespace = settings.Namespace()
	client.Wait = true
	client.Timeout = time.Duration(timeout) * time.Second
	client.Version = version
	
	registryClient, err := install.NewRegistryClient(client.CertFile, client.KeyFile, client.CaFile, client.InsecureSkipTLSverify)
	if err != nil {
		fmt.Printf("missing registry client:")
	}
	client.SetRegistryClient(registryClient)


	chartPath, err := client.ChartPathOptions.LocateChart(chart, settings)
	if err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("INSTALLATION FAILED")
		return
	}
	// Check chart dependencies to make sure all are present in /charts
	ch, err := loader.Load(chartPath)
	if err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("INSTALLATION FAILED")
		return
	}
	// Create context and prepare the handle of SIGTERM
	ctx := context.Background()

	rel, err := client.RunWithContext(ctx, releaseName, ch, valueOpts)
	_ = rel 
	if err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("UPGRADE FAILED")
		return
	}

	g.JSON(http.StatusOK, gin.H{
		"message": "The enabler was upgraded succesfully",
	})
}

func historyHelmChart(g *gin.Context) {
	enabler := g.Param("enabler")

	var settings = install.Settings

	body, err := ioutil.ReadAll(g.Request.Body)
	currentMap :=  map[string]interface{}{}
	if err := json.Unmarshal([]byte(string(body)), &currentMap); err != nil {
		g.Error(errors.New(err))
		return
	}

	kubeconfig := currentMap["credentials"]
	if err := install.CreateKubeConfig(kubeconfig); err != nil {
		g.Error(errors.New(err))
		return
	}

	// Helm Code
	actionConfig := new(action.Configuration)
	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(settings.RESTClientGetter(), settings.Namespace(), helmDriver, install.Debug); err != nil {
		panic(err.Error())
	}
	client := action.NewHistory(actionConfig)
	client.Max = 256
	history, err := history.GetHistory(client, enabler)

	if err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("GET HISTORY FAILED")
		return
	}

	g.JSON(http.StatusOK, history)
}

func rollbackHelmChart(g *gin.Context) {
	
	releaseName := g.GetHeader("Release-Name")
	revision := g.GetHeader("Revision")
	timeoutHeader := g.GetHeader("Timeout")

	var settings = install.Settings

	body, err := ioutil.ReadAll(g.Request.Body)
	currentMap :=  map[string]interface{}{}
	if err := json.Unmarshal([]byte(string(body)), &currentMap); err != nil {
		g.Error(errors.New(err))
		return
	}

	kubeconfig := currentMap["credentials"]
	if err := install.CreateKubeConfig(kubeconfig); err != nil {
		g.Error(errors.New(err))
		return
	}
	
	timeout,err := strconv.Atoi(timeoutHeader)
	if err != nil || timeoutHeader == "" {
		timeout = 120
		fmt.Printf("Default timeout set to 1 minute")
	}

	version, err := strconv.Atoi(revision)
	if err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("Coul not convert string to int revision")
		return	
	}

	// Helm Code
	actionConfig := new(action.Configuration)
	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(settings.RESTClientGetter(), settings.Namespace(), helmDriver, install.Debug); err != nil {
		panic(err.Error())
	}
	client := action.NewRollback(actionConfig)

	client.Wait = true
	client.Timeout = time.Duration(timeout) * time.Second
	client.Version = version

	if err := client.Run(releaseName); err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("ROLLBACK FAILED")
		return	
	}

	g.JSON(http.StatusOK, gin.H{
		"message": "Rollback was a success",
	})
}

/*************** Auxiliar routes *****************/

func showValuesHelmChart(g *gin.Context){
	chart := g.GetHeader("Chart")

	var settings = install.Settings

	body, err := ioutil.ReadAll(g.Request.Body)
	currentMap :=  map[string]interface{}{}
	if err := json.Unmarshal([]byte(string(body)), &currentMap); err != nil {
		g.Error(errors.New(err))
		return
	}

	kubeconfig := currentMap["credentials"]
	if err := install.CreateKubeConfig(kubeconfig); err != nil {
		g.Error(errors.New(err))
		return
	}

	// Helm Code
	actionConfig := new(action.Configuration)
	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(settings.RESTClientGetter(), settings.Namespace(), helmDriver, install.Debug); err != nil {
		panic(err.Error())
	}
	client := action.NewShowWithConfig(action.ShowAll, actionConfig)
	client.OutputFormat = action.ShowValues

	if err := localvalues.AddRegistryClient(client); err != nil {
		g.Error(errors.New(err))
		return
	}
	
	cp, err := client.ChartPathOptions.LocateChart(chart, settings)
	if err != nil {
		g.Error(errors.New(err))
		return
	}
	values, err := client.Run(cp)
	if err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("SHOW VALUES FAILED")
		return
	}

	datos, err := localvalues.ConvertYAMLtoJSON([]byte(values))
	if err != nil {
		g.Error(errors.New(err))
		return
	}	
	g.Data(200, "application/json", datos)
}

func listHelmChartEnabled(g *gin.Context){

	var settings = install.Settings

	body, err := ioutil.ReadAll(g.Request.Body)
	currentMap :=  map[string]interface{}{}
	if err := json.Unmarshal([]byte(string(body)), &currentMap); err != nil {
		g.Error(errors.New(err))
		return
	}

	kubeconfig := currentMap["credentials"]
	if err := install.CreateKubeConfig(kubeconfig); err != nil {
		g.Error(errors.New(err))
		return
	}

	// Helm Code
	actionConfig := new(action.Configuration)
	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(settings.RESTClientGetter(), settings.Namespace(), helmDriver, install.Debug); err != nil {
		panic(err.Error())
	}
	client := action.NewList(actionConfig)

	results, err := client.Run()
	if err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("SHOW VALUES FAILED")
		return
	}
	g.JSON(http.StatusOK, results)

}

type searchRepoOptions struct {
	versions     bool
	regexp       bool
	devel        bool
	version      string
	maxColWidth  uint
	repoFile     string
	repoCacheDir string
}
const searchMaxScore = 25

func listHelmChartByRepo(g *gin.Context){
	repository := g.Param("repository")

	args := []string{repository}

	o := &searchRepoOptions{}
	o.versions = true
	o.repoFile = repoDir
	o.repoCacheDir = cacheDir
	result,err := o.run(args)
	_ = result
	if err != nil {
		s := err.Error()
		g.Error(errors.New(s))
		fmt.Printf("SHOW VALUES FAILED")
		return
	}
	g.JSON(http.StatusOK, result)

}

func (o *searchRepoOptions) run( args []string)([]*search.Result, error) {
	o.setupSearchedVersion()

	index, err := o.buildIndex()
	if err != nil {
		return nil,err
	}

	var res []*search.Result
	if len(args) == 0 {
		res = index.All()
	} else {
		q := strings.Join(args, " ")
		res, err = index.Search(q, searchMaxScore, o.regexp)
		if err != nil {
			return nil,err
		}
	}

	search.SortScore(res)
	data, err := o.applyConstraint(res)
	if err != nil {
		return nil,err
	}
	return data,nil
}

func (o *searchRepoOptions) setupSearchedVersion() {
	if o.version != "" {
		return
	}

	if o.devel { // search for releases and prereleases (alpha, beta, and release candidate releases).
		o.version = ">0.0.0-0"
	} else { // search only for stable releases, prerelease versions will be skip
		o.version = ">0.0.0"
	}
}

func (o *searchRepoOptions) applyConstraint(res []*search.Result) ([]*search.Result, error) {
	if o.version == "" {
		return res, nil
	}

	constraint, err := semver.NewConstraint(o.version)
	if err != nil {
		return res, err
	}

	data := res[:0]
	foundNames := map[string]bool{}
	for _, r := range res {
		// if not returning all versions and already have found a result,
		// you're done!
		if !o.versions && foundNames[r.Name] {
			continue
		}
		v, err := semver.NewVersion(r.Chart.Version)
		if err != nil {
			continue
		}
		if constraint.Check(v) {
			data = append(data, r)
			foundNames[r.Name] = true
		}
	}

	return data, nil
}

func (o *searchRepoOptions) buildIndex() (*search.Index, error) {
	// Load the repositories.yaml
	rf, err := repo.LoadFile(o.repoFile)
	if os.IsNotExist(err) || len(rf.Repositories) == 0 {
		return nil, errors.New("no repositories configured")
	}

	i := search.NewIndex()
	for _, re := range rf.Repositories {
		n := re.Name
		f := filepath.Join(o.repoCacheDir, helmpath.CacheIndexFile(n))
		ind, err := repo.LoadIndexFile(f)
		if err != nil {
			return nil,errors.New("Repo is corrupt or missing. Try 'helm repo update'.")
		}

		i.AddRepo(n, ind, o.versions || len(o.version) > 0)
	}
	return i, nil
}