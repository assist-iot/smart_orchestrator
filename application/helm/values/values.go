package values

import (
	"gopkg.in/yaml.v2"
	"fmt"
	"auxiliar/install"
	"helm.sh/helm/v3/pkg/action"
	"encoding/json"
)

func AddRegistryClient(client *action.Show) error {
	registryClient, err := install.NewRegistryClient(client.CertFile, client.KeyFile, client.CaFile, client.InsecureSkipTLSverify)
	if err != nil {
		return fmt.Errorf("missing registry client: %w", err)
	}
	client.SetRegistryClient(registryClient)
	return nil
}

func ConvertYAMLtoJSON(yamlData []byte) ([]byte, error) {
	var data interface{}

	err := yaml.Unmarshal(yamlData, &data)
	if err != nil {
		return nil, fmt.Errorf("error al unmarshal YAML: %v", err)
	}
	data = convert(data)
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("error al marshal JSON: %v", err)
	}

	return jsonData, nil
}

func convert(i interface{}) interface{} {
    switch x := i.(type) {
    case map[interface{}]interface{}:
        m2 := map[string]interface{}{}
        for k, v := range x {
            m2[k.(string)] = convert(v)
        }
        return m2
    case []interface{}:
        for i, v := range x {
            x[i] = convert(v)
        }
    }
    return i
}