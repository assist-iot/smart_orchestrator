package repo

import (
	"path/filepath"
	"os"
	"helm.sh/helm/v3/pkg/helmpath"
)

type PublicRepo struct {
    Name  string
    URL   string
}

type PrivateRepo struct {
    Name  string
    URL   string
	Username string
	Password string
}

func RemoveRepoCache(cacheDir, name string) error {
	idx := filepath.Join(cacheDir, helmpath.CacheChartsFile(name))
	if _, err := os.Stat(idx); err == nil {
		os.Remove(idx)
	}

	idx = filepath.Join(cacheDir, helmpath.CacheIndexFile(name))
	if _, err := os.Stat(idx); os.IsNotExist(err) {
		return nil
	} else if err != nil {
		return err
	}
	return os.Remove(idx)
}