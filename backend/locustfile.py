import os
from locust import HttpUser, task, between, events

class AIPlatformUser(HttpUser):
    # Simulate a user waiting 1 to 5 seconds between actions
    wait_time = between(1, 5)

    def on_start(self):
        """Called when a user starts. We set up the auth header here."""
        # Get the API key from environment variable, default to a placeholder
        self.api_key = os.getenv("TEST_API_KEY", "your_test_api_key_here")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    @task(3)
    def health_check(self):
        """Simulate a user hitting the health check endpoint."""
        self.client.get("/health", name="/health")

    @task(1)
    def list_models(self):
        """Simulate a user listing available models."""
        self.client.get("/v1/models", headers=self.headers, name="/v1/models")

    @task(2)
    def submit_inference(self):
        """Simulate a user submitting a non-streaming AI inference request."""
        payload = {
            "model": "gemma2:2b-instruct-q4_K_M", # Change to the model you have available
            "messages": [
                {"role": "user", "content": "Explain quantum computing in 3 sentences."}
            ],
            "stream": True
        }
        
        with self.client.post(
            "/v1/chat/completions",
            json=payload,
            headers=self.headers,
            name="/v1/chat/completions",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 401:
                response.failure("Unauthorized: Check your TEST_API_KEY")
            elif response.status_code == 429:
                response.failure("Rate limited")
            else:
                response.failure(f"Failed with status {response.status_code}")

# Optional: Print a warning if API key is not set when the test starts
@events.init.add_listener
def on_locust_init(environment, **_kwargs):
    if not os.getenv("TEST_API_KEY"):
        print("\nWARNING: TEST_API_KEY environment variable is not set!")
        print("Inference requests will likely fail with 401 Unauthorized.")
        print("Run with: TEST_API_KEY=your_key locust -f locustfile.py\n")
