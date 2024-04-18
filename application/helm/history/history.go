package history

import (
	"fmt"

	"helm.sh/helm/v3/pkg/releaseutil"
	helmtime "helm.sh/helm/v3/pkg/time"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/action"

)

type releaseInfo struct {
	Revision    int           `json:"revision"`
	Updated     helmtime.Time `json:"updated"`
	Status      string        `json:"status"`
	Chart       string        `json:"chart"`
	AppVersion  string        `json:"app_version"`
	Description string        `json:"description"`
}

type releaseHistory []releaseInfo
 
func GetHistory(client *action.History, name string) (releaseHistory, error) {
	hist, err := client.Run(name)
	if err != nil {
		return nil, err
	}

	releaseutil.Reverse(hist, releaseutil.SortByRevision)

	var rels []*release.Release
	for i := 0; i < min(len(hist), client.Max); i++ {
		rels = append(rels, hist[i])
	}

	if len(rels) == 0 {
		return releaseHistory{}, nil
	}

	releaseHistory := getReleaseHistory(rels)

	return releaseHistory, nil
}

func getReleaseHistory(rls []*release.Release) (history releaseHistory) {
	for i := len(rls) - 1; i >= 0; i-- {
		r := rls[i]
		c := formatChartname(r.Chart)
		s := r.Info.Status.String()
		v := r.Version
		d := r.Info.Description
		a := formatAppVersion(r.Chart)

		rInfo := releaseInfo{
			Revision:    v,
			Status:      s,
			Chart:       c,
			AppVersion:  a,
			Description: d,
		}
		if !r.Info.LastDeployed.IsZero() {
			rInfo.Updated = r.Info.LastDeployed

		}
		history = append(history, rInfo)
	}

	return history
}

func formatChartname(c *chart.Chart) string {
	if c == nil || c.Metadata == nil {
		// This is an edge case that has happened in prod, though we don't
		// know how: https://github.com/helm/helm/issues/1347
		return "MISSING"
	}
	return fmt.Sprintf("%s-%s", c.Name(), c.Metadata.Version)
}

func formatAppVersion(c *chart.Chart) string {
	if c == nil || c.Metadata == nil {
		// This is an edge case that has happened in prod, though we don't
		// know how: https://github.com/helm/helm/issues/1347
		return "MISSING"
	}
	return c.AppVersion()
}

func min(x, y int) int {
	if x < y {
		return x
	}
	return y
}
