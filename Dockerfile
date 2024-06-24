# Dockerfile for building the image

FROM python:3.10

# upgrade pip
RUN pip install --upgrade pip

# We copy just the requirements.txt first to leverage Docker cache
COPY requirements.txt ./requirements.txt

WORKDIR .

RUN pip install -r requirements.txt

COPY . .

ENTRYPOINT [ "python3" ]

CMD [ "app.py" ]