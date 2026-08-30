# planner_executor_system.py
import random
import datetime

# Base Agent
class Agent:
    def __init__(self, name):
        self.name = name

    def can_handle(self, task):
        raise NotImplementedError

    def execute(self, task):
        raise NotImplementedError


# Math Executor
class MathExecutor(Agent):
    def __init__(self):
        super().__init__("MathExecutor")

    def can_handle(self, task):
        return task.startswith("calculate")

    def execute(self, task):
        try:
            expression = task.replace("calculate", "").strip()
            result = eval(expression)
            return f"{self.name}: The result of {expression} is {result}."
        except Exception:
            return f"{self.name}: Sorry, I couldn’t calculate that."


# Joke Executor
class JokeExecutor(Agent):
    def __init__(self):
        super().__init__("JokeExecutor")

    def can_handle(self, task):
        return "joke" in task

    def execute(self, task):
        jokes = [
            "Why don’t programmers like nature? Too many bugs.",
            "Why do computers get cold? Because they left their Windows open!"
        ]
        return f"{self.name}: {random.choice(jokes)}"


# Time Executor
class TimeExecutor(Agent):
    def __init__(self):
        super().__init__("TimeExecutor")

    def can_handle(self, task):
        return "time" in task

    def execute(self, task):
        now = datetime.datetime.now()
        return f"{self.name}: The current time is {now.strftime('%H:%M:%S')}."


# Planner Agent
class PlannerAgent:
    def __init__(self, executors):
        self.executors = executors

    def plan(self, user_input):
        # Simple planning logic: map input to task
        if "calculate" in user_input.lower():
            return f"calculate {user_input.lower().replace('calculate', '').strip()}"
        elif "joke" in user_input.lower():
            return "joke"
        elif "time" in user_input.lower():
            return "time"
        else:
            return "unknown"

    def delegate(self, task):
        for executor in self.executors:
            if executor.can_handle(task):
                return executor.execute(task)
        return "Planner: Sorry, I don’t know how to handle that."


def run_system():
    executors = [MathExecutor(), JokeExecutor(), TimeExecutor()]
    planner = PlannerAgent(executors)

    print("Planner: Hi! I can calculate, tell jokes, or give the time. Type 'bye' to exit.")
    while True:
        user_input = input("You: ")
        if "bye" in user_input.lower():
            print("Planner: Goodbye! Planner–Executor system signing off.")
            break
        task = planner.plan(user_input)
        response = planner.delegate(task)
        print(response)


if __name__ == "__main__":
    run_system()
