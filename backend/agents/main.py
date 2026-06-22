import argparse
import asyncio
import sys
import os
from agency_agent_runner import (
    AgencyAgentRegistry, 
    create_agent, 
    send_xml_payload,
    read_project_file,
    write_project_file,
    list_project_dir,
    run_project_command,
    list_project_documentation,
    read_project_documentation
)
from google.antigravity import Agent, LocalAgentConfig

# Initialize registry
registry = AgencyAgentRegistry()

async def ask_subagent(agent_name: str, query: str) -> str:
    """Delegates a specific sub-task or question to a specialized sub-agent and gets their response.
    
    Args:
        agent_name: The name of the specialized agent (e.g., 'Application Security Engineer', 'GIS Analyst', 'Backend Architect').
        query: The specific task or question for that agent.
    """
    meta = registry.get_agent_metadata(agent_name)
    if not meta:
        # Fallback search if exact match fails
        names = registry.get_agent_names()
        matches = [n for n in names if agent_name.lower() in n.lower()]
        if matches:
            agent_name = matches[0]
        else:
            return f"Error: Agent '{agent_name}' not found. Available agents: {', '.join(names[:10])}..."
            
    # Load subagent without extra tool execution loop to prevent infinite tool loops
    sub_agent = create_agent(agent_name, registry, enable_tools=False)
    async with sub_agent as agent:
        response = await agent.chat(query)
        return await response.text()

def run_list(division_filter: str = None, search_query: str = None):
    divisions = registry.get_agents_by_division()
    
    print("=== Agency Agents Registry ===")
    total = 0
    for div, agents in divisions.items():
        if division_filter and div.lower() != division_filter.lower():
            continue
            
        filtered_agents = agents
        if search_query:
            filtered_agents = [
                a for a in agents 
                if search_query.lower() in a["name"].lower() or search_query.lower() in a["description"].lower()
            ]
            
        if not filtered_agents:
            continue
            
        print(f"\n--- Division: {div.upper()} ({len(filtered_agents)} agents) ---")
        for agent in filtered_agents:
            emoji = agent["emoji"] if agent["emoji"] else "🤖"
            print(f"  {emoji}  {agent['name']}: {agent['description']}")
            total += 1
            
    print(f"\nTotal agents listed: {total}")

async def run_chat(agent_name: str, single_prompt: str = None):
    meta = registry.get_agent_metadata(agent_name)
    if not meta:
        print(f"Error: Agent '{agent_name}' not found.")
        return
        
    emoji = meta["emoji"] if meta["emoji"] else "🤖"
    print(f"=== Initializing Agent: {meta['name']} {emoji} ===")
    print(f"Description: {meta['description']}")
    print(f"Vibe: {meta['vibe']}")
    print("=" * 60)
    
    agent = create_agent(agent_name, registry, enable_tools=True)
    
    async with agent as active_agent:
        if single_prompt:
            print(f"\nUser: {single_prompt}")
            response = await active_agent.chat(single_prompt)
            print(f"\n{meta['name']}: ", end="", flush=True)
            async for chunk in response:
                print(chunk, end="", flush=True)
            print()
            return
            
        print("\nEntering interactive chat session. Type 'exit' or 'quit' to end.")
        while True:
            try:
                user_input = input("\nUser: ").strip()
                if not user_input:
                    continue
                if user_input.lower() in ("exit", "quit"):
                    break
                    
                response = await active_agent.chat(user_input)
                print(f"\n{meta['name']}: ", end="", flush=True)
                async for chunk in response:
                    print(chunk, end="", flush=True)
                print()
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"\nError: {e}")

async def run_collaboration(coordinator_name: str, task: str):
    meta = registry.get_agent_metadata(coordinator_name)
    if not meta:
        print(f"Error: Coordinator agent '{coordinator_name}' not found.")
        return
        
    emoji = meta["emoji"] if meta["emoji"] else "🤖"
    print(f"=== Initializing Coordinator: {meta['name']} {emoji} ===")
    print(f"Task: {task}")
    print("=" * 60)
    
    # Configure coordinator agent with tools
    system_instructions = f"""You are the coordinator agent: {meta['name']}.
Description: {meta['description']}
Vibe: {meta['vibe']}

{meta['body']}

Your mission is to coordinate a complex project task. You are equipped with tools to read/write project files, execute commands, list directories, and consult documentation.
You also have the `ask_subagent` tool to delegate sub-tasks to other specialized agents.

## IMPORTANT: Project Context & Documentation
The workspace contains a comprehensive documentation wiki in the `docs/` folder.
Before writing code, executing commands, or planning changes, you MUST read the relevant documentation files under `docs/` using `list_project_documentation` and `read_project_documentation`. This ensures you match established patterns and requirements for routing, search, geofencing, frontend, and database structures.

Always use `ask_subagent` to verify details, consult experts (e.g., Application Security Engineer, GIS Analyst, Web GIS Developer, UX Architect), or run test payloads.
When you finish coordinating the task, write a comprehensive final summary/report of your findings.
"""
    
    config = LocalAgentConfig(
        system_instructions=system_instructions,
        tools=[
            ask_subagent, 
            send_xml_payload,
            read_project_file,
            write_project_file,
            list_project_dir,
            run_project_command,
            list_project_documentation,
            read_project_documentation
        ]
    )
    
    agent = Agent(config)
    async with agent as active_agent:
        response = await active_agent.chat(f"Coordinate the execution of this task: {task}")
        print(f"\n{meta['name']}: ", end="", flush=True)
        async for chunk in response:
            print(chunk, end="", flush=True)
        print()

def main():
    parser = argparse.ArgumentParser(description="Agency Agent Command Line Runner")
    subparsers = parser.add_subparsers(dest="command", help="Subcommand to run")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List available agents")
    list_parser.add_argument("--division", help="Filter by agent division (e.g., engineering, security, gis)")
    list_parser.add_argument("--search", help="Search in agent names or descriptions")
    
    # Chat command
    chat_parser = subparsers.add_parser("chat", help="Chat with a specific agent")
    chat_parser.add_argument("--agent", required=True, help="Name of the agent to chat with")
    chat_parser.add_argument("--prompt", help="A single prompt to send instead of an interactive session")
    
    # Collaborate command
    collab_parser = subparsers.add_parser("collaborate", help="Run a multi-agent collaboration task")
    collab_parser.add_argument("--coordinator", default="Backend Architect", help="Name of the coordinator agent")
    collab_parser.add_argument("--task", required=True, help="The task to perform")
    
    args = parser.parse_args()
    
    if args.command == "list":
        run_list(args.division, args.search)
    elif args.command == "chat":
        asyncio.run(run_chat(args.agent, args.prompt))
    elif args.command == "collaborate":
        asyncio.run(run_collaboration(args.coordinator, args.task))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
