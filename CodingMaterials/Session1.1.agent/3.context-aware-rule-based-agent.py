# context_agent.py

class ContextAgent:
    def __init__(self):
        self.context = None

    def respond(self, user_input):
        user_input = user_input.lower()

        # Greeting sets context
        if "hello" in user_input or "hi" in user_input:
            self.context = "greeting"
            return "Hello! How can I assist you today?"

        # If user asks about weather
        elif "weather" in user_input:
            self.context = "weather"
            return "Do you want today's weather or tomorrow's?"

        # Context-aware follow-up
        elif self.context == "weather":
            if "today" in user_input:
                return "It looks sunny today!"
            elif "tomorrow" in user_input:
                return "Tomorrow might be cloudy."
            else:
                return "I can tell you about today or tomorrow’s weather."

        # Joke context
        elif "joke" in user_input:
            self.context = "joke"
            return "Do you prefer a programming joke or a general one?"

        elif self.context == "joke":
            if "programming" in user_input:
                return "Why do programmers prefer dark mode? Because light attracts bugs!"
            elif "general" in user_input:
                return "Why don’t scientists trust atoms? Because they make up everything!"
            else:
                return "I can tell a programming or a general joke."

        elif "bye" in user_input:
            return "Goodbye! Have a great day!"

        else:
            return "I’m not sure how to respond to that yet."

def run_agent():
    agent = ContextAgent()
    print("Agent: Hi! Type 'bye' to exit.")
    while True:
        user_input = input("You: ")
        response = agent.respond(user_input)
        print("Agent:", response)
        if "bye" in user_input.lower():
            break

if __name__ == "__main__":
    run_agent()
