import threading
import time
import requests
import random
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("AgentOrchestrator")

BASE_URL = "http://localhost:4000"

def load_tester_agent():
    """Agent 1: Generates rapid, sustained load against the autocomplete endpoint."""
    logger.info("Load Tester Agent started.")
    endpoints = [
        "/v1/autocomplete?text=Damascus",
        "/v1/autocomplete?text=Aleppo",
        "/v1/reverse?point.lat=33.5138&point.lon=36.2765"
    ]
    for i in range(50):
        try:
            url = BASE_URL + random.choice(endpoints)
            res = requests.get(url, timeout=2)
            if res.status_code == 429:
                logger.warning(f"LoadTester: Rate limit hit! (429 Too Many Requests)")
            else:
                logger.debug(f"LoadTester: {res.status_code} received.")
        except Exception as e:
            logger.error(f"LoadTester Error: {e}")
        time.sleep(0.1) # Aggressive polling
    logger.info("Load Tester Agent finished.")

def pen_tester_agent():
    """Agent 2: Attempts SQL injection, XSS payloads, and malformed requests."""
    logger.info("Penetration Tester Agent started.")
    malicious_payloads = [
        "/v1/autocomplete?text=' OR 1=1 --",
        "/v1/autocomplete?text=<script>alert(1)</script>",
        "/v1/reverse?point.lat=999&point.lon=-999",
        "/v1/autocomplete?text=" + "A" * 5000  # Buffer overflow attempt
    ]
    for payload in malicious_payloads:
        try:
            url = BASE_URL + payload
            logger.info(f"PenTester: Injecting payload {payload[:30]}...")
            res = requests.get(url, timeout=5)
            logger.info(f"PenTester Result: HTTP {res.status_code}")
        except Exception as e:
            logger.error(f"PenTester Error: {e}")
        time.sleep(1)
    logger.info("Penetration Tester Agent finished.")

def tracker_agent():
    """Agent 3: Tracks system health and logs performance degradation."""
    logger.info("Tracker Agent started.")
    for _ in range(10):
        start = time.time()
        try:
            res = requests.get(f"{BASE_URL}/", timeout=2)
            latency = time.time() - start
            logger.info(f"Tracker: Health Ping - Status: {res.status_code}, Latency: {latency:.3f}s")
        except Exception as e:
            logger.error(f"Tracker: Service Unreachable! {e}")
        time.sleep(1)
    logger.info("Tracker Agent finished.")

if __name__ == "__main__":
    logger.info("Initializing Agent Fleet (3 Custom Agents)...")
    
    t1 = threading.Thread(target=load_tester_agent, name="LoadTester")
    t2 = threading.Thread(target=pen_tester_agent, name="PenTester")
    t3 = threading.Thread(target=tracker_agent, name="Tracker")
    
    t1.start()
    t2.start()
    t3.start()
    
    t1.join()
    t2.join()
    t3.join()
    
    logger.info("Agent Orchestration Complete.")
