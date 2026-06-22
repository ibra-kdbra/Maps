import os
import re
import glob
from typing import Dict, List, Any, Optional
from google.antigravity import Agent, LocalAgentConfig
import requests
import subprocess

WORKSPACE_DIR = "/home/meitantei/Templates/Interactive_Maps"

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

# Initialize environment
load_env()

def parse_markdown_agent(filepath: str) -> Dict[str, Any]:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    filename = os.path.basename(filepath)
    division = "specialized"
    if "-" in filename:
        division = filename.split("-", 1)[0]

    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
    if not match:
        name = os.path.splitext(os.path.basename(filepath))[0]
        return {
            "name": name,
            "description": "",
            "color": "",
            "emoji": "",
            "vibe": "",
            "division": division,
            "body": content
        }
    
    frontmatter_text = match.group(1)
    body = match.group(2)
    
    frontmatter = {}
    for line in frontmatter_text.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            frontmatter[k.strip().lower()] = v.strip().strip('"').strip("'")
            
    # Determine division from filename prefix (e.g. engineering-backend-architect.md -> engineering)
    filename = os.path.basename(filepath)
    division = "specialized"
    if "-" in filename:
        division = filename.split("-", 1)[0]
            
    return {
        "name": frontmatter.get("name", os.path.splitext(os.path.basename(filepath))[0]),
        "description": frontmatter.get("description", ""),
        "color": frontmatter.get("color", ""),
        "emoji": frontmatter.get("emoji", ""),
        "vibe": frontmatter.get("vibe", ""),
        "division": division,
        "body": body
    }

class AgencyAgentRegistry:
    def __init__(self, definitions_dir: str = None):
        if definitions_dir is None:
            definitions_dir = os.path.join(os.path.dirname(__file__), "definitions")
        self.definitions_dir = definitions_dir
        self.agents_metadata = {}
        self.load_all_metadata()
        
    def load_all_metadata(self):
        pattern = os.path.join(self.definitions_dir, "*.md")
        for filepath in glob.glob(pattern):
            try:
                meta = parse_markdown_agent(filepath)
                meta["filepath"] = filepath
                # Index by name
                self.agents_metadata[meta["name"].lower()] = meta
            except Exception as e:
                print(f"Error loading agent file {filepath}: {e}")
                
    def get_agent_names(self) -> List[str]:
        return sorted([meta["name"] for meta in self.agents_metadata.values()])
        
    def get_agents_by_division(self) -> Dict[str, List[Dict[str, Any]]]:
        divisions = {}
        for meta in self.agents_metadata.values():
            div = meta["division"]
            if div not in divisions:
                divisions[div] = []
            divisions[div].append(meta)
        # Sort each division's agents by name
        for div in divisions:
            divisions[div] = sorted(divisions[div], key=lambda x: x["name"])
        return divisions

    def get_agent_metadata(self, name: str) -> Optional[Dict[str, Any]]:
        return self.agents_metadata.get(name.lower())

# Project interaction tools that will be injected to agent configs
def read_project_file(filepath: str) -> str:
    """Reads the contents of a file inside the project workspace.
    
    Args:
        filepath: The relative path to the file from the workspace root.
    """
    safe_path = os.path.abspath(os.path.join(WORKSPACE_DIR, filepath))
    if not safe_path.startswith(WORKSPACE_DIR):
        return "Error: Access denied. Cannot read files outside the project workspace."
    try:
        if not os.path.exists(safe_path):
            return f"Error: File '{filepath}' does not exist."
        with open(safe_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {e}"

def write_project_file(filepath: str, content: str) -> str:
    """Writes content to a file inside the project workspace.
    
    Args:
        filepath: The relative path to the file from the workspace root.
        content: The text content to write.
    """
    safe_path = os.path.abspath(os.path.join(WORKSPACE_DIR, filepath))
    if not safe_path.startswith(WORKSPACE_DIR):
        return "Error: Access denied. Cannot write files outside the project workspace."
    try:
        os.makedirs(os.path.dirname(safe_path), exist_ok=True)
        with open(safe_path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote to file '{filepath}'."
    except Exception as e:
        return f"Error writing file: {e}"

def list_project_dir(dirpath: str = "") -> str:
    """Lists the contents of a directory inside the project workspace.
    
    Args:
        dirpath: The relative path to the directory from the workspace root (default is root "").
    """
    safe_path = os.path.abspath(os.path.join(WORKSPACE_DIR, dirpath))
    if not safe_path.startswith(WORKSPACE_DIR):
        return "Error: Access denied. Cannot list directory outside the project workspace."
    try:
        if not os.path.exists(safe_path):
            return f"Error: Directory '{dirpath}' does not exist."
        items = os.listdir(safe_path)
        out = []
        for item in items:
            p = os.path.join(safe_path, item)
            is_dir = os.path.isdir(p)
            out.append(f"{'[DIR] ' if is_dir else '[FILE]'} {item}")
        return "\n".join(out) if out else "(empty)"
    except Exception as e:
        return f"Error listing directory: {e}"

def run_project_command(command: str) -> str:
    """Runs a shell command in the project root directory.
    
    Args:
        command: The shell command to execute.
    """
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=WORKSPACE_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=15
        )
        out = ""
        if result.stdout:
            out += result.stdout
        if result.stderr:
            out += f"\n--- STDERR ---\n{result.stderr}"
        return out if out else "(No output)"
    except subprocess.TimeoutExpired:
        return "Error: Command timed out after 15 seconds."
    except Exception as e:
        return f"Error running command: {e}"

def send_xml_payload(xml_content: str) -> str:
    """Fires an XML payload at the local Golang ingestion API.
    Use this tool to test vulnerabilities.
    
    Args:
        xml_content: The raw XML string to send.
    """
    TARGET_API_URL = "http://localhost:8081/api/v1/ingest-override"
    try:
        response = requests.post(
            TARGET_API_URL, 
            data=xml_content,
            headers={"Content-Type": "application/xml"},
            timeout=5
        )
        return f"Status: {response.status_code}\nResponse: {response.text}"
    except Exception as e:
        return f"Error sending payload: {e}"

def list_project_documentation() -> str:
    """Lists all available project documentation files recursively from the docs/ directory.
    Use this to find relevant guides, requirements, design files, or architecture specifications.
    """
    docs_dir = os.path.join(WORKSPACE_DIR, "docs")
    if not os.path.exists(docs_dir):
        return "Error: docs/ directory does not exist."
    try:
        out = []
        for root, dirs, files in os.walk(docs_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, WORKSPACE_DIR)
                out.append(rel_path)
        return "\n".join(sorted(out)) if out else "(No documentation files found)"
    except Exception as e:
        return f"Error listing documentation: {e}"

def read_project_documentation(doc_path: str) -> str:
    """Reads the contents of a specific project documentation file from the docs/ directory.
    
    Args:
        doc_path: The relative path to the doc file starting with 'docs/' (e.g. 'docs/01-product-requirements.md').
    """
    # Clean doc_path
    if not doc_path.startswith("docs/"):
        doc_path = os.path.join("docs", doc_path)
    safe_path = os.path.abspath(os.path.join(WORKSPACE_DIR, doc_path))
    if not safe_path.startswith(os.path.join(WORKSPACE_DIR, "docs")):
        return "Error: Access denied. Can only read files inside the docs/ directory."
    try:
        if not os.path.exists(safe_path):
            return f"Error: Documentation file '{doc_path}' does not exist."
        with open(safe_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"Error reading documentation file: {e}"

def create_agent(name: str, registry: AgencyAgentRegistry, enable_tools: bool = True) -> Optional[Agent]:
    meta = registry.get_agent_metadata(name)
    if not meta:
        return None
    
    # Configure the system instructions
    system_instructions = f"""You are the {meta['name']} agent.
Description: {meta['description']}
Vibe: {meta['vibe']}

{meta['body']}

## IMPORTANT: Project Context & Documentation
The workspace contains a comprehensive documentation wiki in the `docs/` folder.
Before writing any code, planning architectures, or suggesting changes, you MUST read the relevant documentation files under `docs/` using `list_project_documentation` and `read_project_documentation`. This ensures you match established patterns and requirements for routing, search, geofencing, frontend, and database structures.
"""
    
    tools = []
    if enable_tools:
        tools = [
            read_project_file, 
            write_project_file, 
            list_project_dir, 
            run_project_command, 
            send_xml_payload,
            list_project_documentation,
            read_project_documentation
        ]
        
    config = LocalAgentConfig(
        system_instructions=system_instructions,
        tools=tools
    )
    return Agent(config)
