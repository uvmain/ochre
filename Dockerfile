FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && \
    apt-get install -y \
    python3-pip \
    python3-opencv && \
    apt-get clean

COPY package.json package-lock.json ./

RUN npm install

COPY requirements.txt ./
RUN pip3 install -r requirements.txt

COPY . .

EXPOSE 3000

RUN npm run build

CMD ["npm", "start"]
