# =========================
# BASE IMAGE
# =========================
FROM python:3.12-slim

# =========================
# WORKDIR
# =========================
WORKDIR /app

# =========================
# SYSTEM DEPENDENCIES
# =========================
RUN apt-get update && apt-get install -y gcc

# =========================
# COPY FILES
# =========================
COPY requirements.txt .

# =========================
# INSTALL PYTHON LIBS
# =========================
RUN pip install --no-cache-dir -r requirements.txt

# =========================
# COPY PROJECT
# =========================
COPY . .

# =========================
# RUN APP
# =========================
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]