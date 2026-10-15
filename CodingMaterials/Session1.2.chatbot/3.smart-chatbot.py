# chatbot_nlp.py
import nltk
from nltk.chat.util import Chat, reflections

pairs = [
    (r"hi|hello", ["Hello! How can I assist you today?"]),
    (r"my name is (.*)", ["Nice to meet you, %1!"]),
    (r"how are you ?", ["I'm doing well, thanks for asking."]),
    (r"what is your name ?", ["I’m your friendly chatbot agent."]),
    (r"quit", ["Bye! Take care."])
]

def run_chatbot():
    print("Chatbot: Hi! Type 'quit' to exit.")
    chat = Chat(pairs, reflections)
    chat.converse()

if __name__ == "__main__":
    run_chatbot()
