curl -G -s 'http://localhost:3100/loki/api/v1/series' --data-urlencode 'match[]={job="docker-containers"}' > series.json
