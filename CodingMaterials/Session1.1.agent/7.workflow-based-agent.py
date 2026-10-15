# workflow_agent_system.py
import random
import datetime

# Base Agent
class Agent:
    def __init__(self, name):
        self.name = name

    def can_handle(self, step):
        raise NotImplementedError

    def execute(self, step, data=None):
        raise NotImplementedError


# Step 1: Math Agent
class MathAgent(Agent):
    def __init__(self):
        super().__init__("MathAgent")

    def can_handle(self, step):
        return step == "math"

    def execute(self, step, data=None):
        try:
            result = eval(data)
            return result
        except Exception:
            return "Error"


# Step 2: Formatter Agent
class FormatterAgent(Agent):
    def __init__(self):
        super().__init__("FormatterAgent")

    def can_handle(self, step):
        return step == "format"

    def execute(self, step, data=None):
        return f"The result of your calculation is: {data}"


# Step 3: Joke Agent
class JokeAgent(Agent):
    def __init__(self):
        super().__init__("JokeAgent")

    def can_handle(self, step):
        return step == "joke"

    def execute(self, step, data=None):
        jokes = [
            f"Math is fun! Did you know? {data} is a great number!",
            "Why was the equal sign so humble? Because it knew it wasn’t less than or greater than anyone else!"
        ]
        return random.choice(jokes)


# Workflow Coordinator
class WorkflowCoordinator:
    def __init__(self, agents):
        self.agents = agents

    def run_workflow(self, workflow, initial_input):
        data = initial_input
        for step in workflow:
            for agent in self.agents:
                if agent.can_handle(step):
                    data = agent.execute(step, data)
                    break
        return data


def run_system():
    agents = [MathAgent(), FormatterAgent(), JokeAgent()]
    coordinator = WorkflowCoordinator(agents)

    print("Workflow Agent: Hi! I can run workflows like 'calculate → format → joke'. Type 'bye' to exit.")
    while True:
        user_input = input("You: ")
        if "bye" in user_input.lower():
            print("Workflow Agent: Goodbye! Workflow system signing off.")
            break
        elif "calculate" in user_input.lower():
            expression = user_input.lower().replace("calculate", "").strip()
            workflow = ["math", "format", "joke"]
            response = coordinator.run_workflow(workflow, expression)
            print("Workflow Agent:", response)
        else:
            print("Workflow Agent: I only support workflows starting with 'calculate'.")
            

if __name__ == "__main__":
    run_system()
