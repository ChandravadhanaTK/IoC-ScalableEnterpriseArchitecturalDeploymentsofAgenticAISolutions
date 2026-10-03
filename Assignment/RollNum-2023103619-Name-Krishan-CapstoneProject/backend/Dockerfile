FROM python:3.10-slim

WORKDIR /app

COPY requirements_sqlite.txt .
RUN pip install --no-cache-dir -r requirements_sqlite.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main_sqlite:app", "--host", "0.0.0.0", "--port", "8000"]
