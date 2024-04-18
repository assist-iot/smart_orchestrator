package install

import (
	"fmt"
	"os"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	"context"

	"github.com/go-errors/errors"

	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/registry"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/release"

)

var config = os.Getenv("CONFIG")

/*************** Public Variables *****************/

var Settings = cli.New()

/*************** Public Functions *****************/

func RunInstall(args []string, client *action.Install, vals map[string]interface{}) (*release.Release, error) {

	name, chart, err := client.NameAndChart(args)
	if err != nil {
		return nil, err
	}
	client.ReleaseName = name

	cp, err := client.ChartPathOptions.LocateChart(chart, Settings)
	if err != nil {
		return nil, err
	}

	chartRequested, err := loader.Load(cp)
	if err != nil {
		return nil, err
	}

	if err := checkIfInstallable(chartRequested); err != nil {
		return nil, err
	}

	if chartRequested.Metadata.Deprecated {
		fmt.Printf("This chart is deprecated")
	}

	ctx := context.Background()


	return client.RunWithContext(ctx, chartRequested, vals)
}

func CreateValues(values interface{}) (map[string]interface{}, error) {
	base := map[string]interface{}{}
	valuesMap, ok := values.(map[string]interface{})
    if !ok {
        return nil, errors.New("El parámetro 'values' no es un mapa válido")
    }
	// Merge with the previous map
	base = mergeMaps(base, valuesMap)

	return base, nil
}

func CreateKubeConfig(kubeconfig interface{}) error{

	yamlBytes, err := yaml.Marshal(kubeconfig)
	if err != nil {
		return errors.New("Error converting map to YAML")
	}

	err = ioutil.WriteFile(config, yamlBytes, 0644)
	if err != nil {
		return errors.New("Error writing YAML file")
	}

	return nil
}


func Debug(format string, v ...interface{}) {
	if Settings.Debug {
		format = fmt.Sprintf("[debug] %s\n", format)
	}
}

func NewRegistryClient(certFile, keyFile, caFile string, insecureSkipTLSverify bool) (*registry.Client, error) {
	registryClient, err := newDefaultRegistryClient()
	if err != nil {
		return nil, err
	}
	return registryClient, nil
}

/*************** Private Functions *****************/

func newDefaultRegistryClient() (*registry.Client, error) {
	registryClient, err := registry.NewClient(
		registry.ClientOptDebug(Settings.Debug),
		registry.ClientOptEnableCache(true),
		registry.ClientOptWriter(os.Stderr),
		registry.ClientOptCredentialsFile(Settings.RegistryConfig),
	)
	if err != nil {
		return nil, err
	}
	return registryClient, nil
}

func mergeMaps(a, b map[string]interface{}) map[string]interface{} {
	out := make(map[string]interface{}, len(a))
	for k, v := range a {
		out[k] = v
	}
	for k, v := range b {
		if v, ok := v.(map[string]interface{}); ok {
			if bv, ok := out[k]; ok {
				if bv, ok := bv.(map[string]interface{}); ok {
					out[k] = mergeMaps(bv, v)
					continue
				}
			}
		}
		out[k] = v
	}
	return out
}

func checkIfInstallable(ch *chart.Chart) error {
	switch ch.Metadata.Type {
	case "", "application":
		return nil
	}
	return errors.Errorf("%s charts are not installable", ch.Metadata.Type)
}

