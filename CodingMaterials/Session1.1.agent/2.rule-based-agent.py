# rule_based_agent.py

class RuleBasedAgent:
    def __init__(self):
        # Define rules as keyword-response pairs
        self.rules = {
            "hello": "Hello! How can I assist you today?",
            "hi": "Hi there! What can I do for you?",
            "bye": "Goodbye! Have a great day!",
            "help": "I can answer simple questions like greetings, jokes, or weather.",
            "joke": "Why don’t programmers like nature? Too many bugs.",
            "weather": "I can’t fetch live weather yet, but let’s assume it’s sunny!"
        }

    def respond(self, user_input):
        # Normalize input
        user_input = user_input.lower()
        # Check if any rule matches
        for keyword, response in self.rules.items():
            if keyword in user_input:
                return response
        return "Sorry, I don’t understand that yet."

def run_agent():
    agent = RuleBasedAgent()
    print("Agent: Hello! Type 'bye' to exit.")
    while True:
        user_input = input("You: ")
        response = agent.respond(user_input)
        print("Agent:", response)
        if "bye" in user_input.lower():
            break

if __name__ == "__main__":
    run_agent()
