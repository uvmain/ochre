FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && \
    apt-get install -y \
    python3-pip \
    python3.11-venv \
    python3-opencv && \
    apt-get clean

COPY package.json package-lock.json ./

RUN npm install

RUN python3 -m venv /opt/venv

COPY requirements.txt ./

RUN . /opt/venv/bin/activate && pip install --no-cache-dir -r requirements.txt

ENV PATH="/opt/venv/bin:$PATH"

COPY . .

EXPOSE 3000

RUN npm run build

CMD ["npm", "start"]
