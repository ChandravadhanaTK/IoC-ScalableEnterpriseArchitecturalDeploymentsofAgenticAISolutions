# multi_agent_system.py
import random
import datetime

# Base Agent class
class Agent:
    def __init__(self, name):
        self.name = name

    def can_handle(self, user_input):
        raise NotImplementedError

    def respond(self, user_input):
        raise NotImplementedError


# Math Agent
class MathAgent(Agent):
    def __init__(self):
        super().__init__("MathAgent")

    def can_handle(self, user_input):
        return "calculate" in user_input.lower()

    def respond(self, user_input):
        try:
            expression = user_input.lower().replace("calculate", "").strip()
            result = eval(expression)
            return f"{self.name}: The result of {expression} is {result}."
        except Exception:
            return f"{self.name}: Sorry, I couldn’t calculate that."


# Joke Agent
class JokeAgent(Agent):
    def __init__(self):
        super().__init__("JokeAgent")

    def can_handle(self, user_input):
        return "joke" in user_input.lower()

    def respond(self, user_input):
        jokes = [
            "Why don’t programmers like nature? Too many bugs.",
            "Why do computers get cold? Because they left their Windows open!"
        ]
        return f"{self.name}: {random.choice(jokes)}"


# Time Agent
class TimeAgent(Agent):
    def __init__(self):
        super().__init__("TimeAgent")

    def can_handle(self, user_input):
        return "time" in user_input.lower()

    def respond(self, user_input):
        now = datetime.datetime.now()
        return f"{self.name}: The current time is {now.strftime('%H:%M:%S')}."


# Coordinator Agent
class CoordinatorAgent:
    def __init__(self, agents):
        self.agents = agents

    def route(self, user_input):
        for agent in self.agents:
            if agent.can_handle(user_input):
                return agent.respond(user_input)
        return "Coordinator: Sorry, I don’t understand that request."


def run_system():
    agents = [MathAgent(), JokeAgent(), TimeAgent()]
    coordinator = CoordinatorAgent(agents)

    print("Coordinator: Hi! I can calculate, tell jokes, or give the time. Type 'bye' to exit.")
    while True:
        user_input = input("You: ")
        if "bye" in user_input.lower():
            print("Coordinator: Goodbye! Multi-agent system signing off.")
            break
        response = coordinator.route(user_input)
        print(response)


if __name__ == "__main__":
    run_system()
