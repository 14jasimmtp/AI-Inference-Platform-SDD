from prometheus_client import Counter, generate_latest
import httpx
try:
    c = Counter('test_metric', 'test', ['label1'])
    print(generate_latest().decode('utf-8'))
except Exception as e:
    print(e)
