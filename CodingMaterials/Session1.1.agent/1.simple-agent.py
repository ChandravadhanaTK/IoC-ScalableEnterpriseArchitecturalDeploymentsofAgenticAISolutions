# simple_agent.py

import random

class SimpleAgent:
    def __init__(self, name="Agent"):
        self.name = name

    def respond(self, user_input):
        user_input = user_input.lower()

        if "hello" in user_input or "hi" in user_input:
            return "Hello! How can I assist you today?"
        elif "weather" in user_input:
            return "I can’t fetch live weather yet, but imagine it’s sunny!"
        elif "joke" in user_input:
            jokes = [
                "Why don’t programmers like nature? Too many bugs.",
                "I told my computer I needed a break, and it said: 'No problem, I’ll go to sleep.'"
            ]
            return random.choice(jokes)
        elif "bye" in user_input:
            return "Goodbye! Have a great day!"
        else:
            return "I’m not sure how to respond to that yet."

def run_agent():
    agent = SimpleAgent("HelperBot")
    print(f"{agent.name}: Hi, I’m your simple agent. Type 'bye' to exit.")
    while True:
        user_input = input("You: ")
        response = agent.respond(user_input)
        print(f"{agent.name}: {response}")
        if "bye" in user_input.lower():
            break

if __name__ == "__main__":
    run_agent()


# & "C:\Program Files\Python312\python.exe" D:\develop\CEG\agent\simple-agent.py