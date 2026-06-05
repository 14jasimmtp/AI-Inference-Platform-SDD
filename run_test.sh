#!/bin/bash
docker exec api-backend python -c '
from prometheus_client import Counter, generate_latest
c = Counter("test_metric", "test", ["l1"])
print(generate_latest().decode("utf-8"))
'
