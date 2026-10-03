Run the full pytest test suite.

Steps:
1. Check whether `/tmp/chatbot-test-venv/bin/python` exists.
   - If not, create the venv with Python 3.10 and install dependencies:
     ```
     ~/.pyenv/versions/3.10.12/bin/python -m venv /tmp/chatbot-test-venv
     /tmp/chatbot-test-venv/bin/pip install -r backend/requirements_sqlite.txt beautifulsoup4 httpx
     /tmp/chatbot-test-venv/bin/pip install "httpx<0.28"
     ```
2. Run the tests from the project root:
   ```
   /tmp/chatbot-test-venv/bin/python -m pytest test/ -v
   ```
3. Report the pass/fail summary and list any failing tests with their error messages.
