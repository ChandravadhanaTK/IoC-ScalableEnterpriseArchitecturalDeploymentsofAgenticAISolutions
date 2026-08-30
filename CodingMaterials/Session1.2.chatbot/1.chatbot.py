def chatbot_response(user_input):
    responses = {
        "hello": "Hi there! How can I help you?",
        "bye": "Goodbye! Have a great day!",
        "help": "I can answer simple questions. Try asking me something!"
    }
    return responses.get(user_input.lower(), "Sorry, I didn’t understand that.")

# Example usage
print(chatbot_response("hello"))

#  & "C:\Program Files\Python312\python.exe" d:/develop/CEG/chatbot.py  