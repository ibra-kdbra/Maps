import os
import requests
from typing import Dict, Any
import asyncio
from google.antigravity import Agent, LocalAgentConfig

def load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Load configuration from local .env file
load_env()

# The target Golang API endpoint we built in Sprint 3
TARGET_API_URL = "http://localhost:8081/api/v1/ingest-override"

def send_xml_payload(xml_content: str) -> Dict[str, Any]:
    """
    Fires an XML payload at the local Golang ingestion API.
    Use this tool to test vulnerabilities.
    
    Args:
        xml_content: The raw XML string to send.
    """
    try:
        response = requests.post(
            TARGET_API_URL, 
            data=xml_content,
            headers={"Content-Type": "application/xml"},
            timeout=5
        )
        return {
            "status_code": response.status_code,
            "response_text": response.text,
            "success": response.ok
        }
    except Exception as e:
        return {
            "error": str(e),
            "success": False
        }

async def run_penetration_test():
    # Setup configuration, assumes GEMINI_API_KEY is in the environment
    config = LocalAgentConfig(
        tools=[send_xml_payload],
        system_instructions="""
You are an elite Application Security Engineer performing Red Team penetration testing.
Your target is a local Golang API that parses OpenStreetMap XML files (fixes.osm).
Your goal is to crash the API, exhaust its memory, or bypass its negative-ID validation logic.

Execute the following three attacks sequentially using your `send_xml_payload` tool:
1. **Billion Laughs Attack (XML Bomb):** Generate a classic XML entity expansion payload and fire it.
2. **Data Corruption Bypass:** Generate a perfectly valid OSM XML but inject `<node id="9999999">` (a positive integer). Our validation should block this.
3. **XSS Injection:** Generate a valid OSM XML with negative IDs, but in the `<way><tag k="name" v="..."></way>`, inject a malicious `<script>alert(1)</script>` payload.

After executing all three attacks, analyze the responses. Tell me which attacks were successfully blocked by the Golang backend, and which ones slipped through.
"""
    )
    
    # Instantiate the agent with the custom tool
    async with Agent(config) as agent:

        print("=== Starting Autonomous AppSec Agent ===")
        print("Agent is actively formulating and executing payloads against localhost:8081...\n")

        # We trigger the agent with a blank start prompt so it begins its system instructions.
        response = await agent.chat("Commence attack sequence.")
        
        print("\n=== Agent Final Report ===")
        print(await response.text())

if __name__ == "__main__":
    asyncio.run(run_penetration_test())
