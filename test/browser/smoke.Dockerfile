FROM mcr.microsoft.com/playwright:v1.59.0-noble

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip \
  && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip.sig" -o awscliv2.sig \
  && gpg --keyserver hkps://keyserver.ubuntu.com --recv-keys FB5DB77FD5C118B80511ADA8A6310ACC4672475C \
  && gpg --verify awscliv2.sig awscliv2.zip \
  && python3 -m zipfile -e awscliv2.zip . \
  && chmod +x ./aws/install \
  && ./aws/install \
  && rm -rf awscliv2.zip awscliv2.sig aws

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY test/browser .

RUN chmod +x run-smoke-tests.sh

ENTRYPOINT ["./run-smoke-tests.sh"]
