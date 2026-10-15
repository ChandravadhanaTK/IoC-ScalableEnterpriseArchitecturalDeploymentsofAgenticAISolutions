# chatbot.py

def chatbot_response(user_input):
    responses = {
        "hello": "Hi there! How can I help you?",
        "how are you": "I'm just code, but I'm doing great!",
        "bye": "Goodbye! Have a wonderful day!",
        "help": "I can answer simple questions. Try asking me something!"
    }
    return responses.get(user_input.lower(), "Sorry, I didn’t understand that.")

def run_chatbot():
    print("Chatbot: Hello! Type 'bye' to exit.")
    while True:
        user_input = input("You: ")
        if user_input.lower() == "bye":
            print("Chatbot:", chatbot_response(user_input))
            break
        else:
            print("Chatbot:", chatbot_response(user_input))

if __name__ == "__main__":
    run_chatbot()
