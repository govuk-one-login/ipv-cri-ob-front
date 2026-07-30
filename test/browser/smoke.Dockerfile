FROM mcr.microsoft.com/playwright:v1.62.0-noble@sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip \
  && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip.sig" -o awscliv2.sig \
  && gpg --keyserver hkps://keyserver.ubuntu.com --recv-keys FB5DB77FD5C118B80511ADA8A6310ACC4672475C \
  && gpg --verify awscliv2.sig awscliv2.zip \
  && python3 -m zipfile -e awscliv2.zip . \
  && chmod +x ./aws/install \
  && ./aws/install \
  && chmod +x /usr/local/bin/aws \
  && rm -rf awscliv2.zip awscliv2.sig aws

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# run-tests.sh must be in the container root and made executable
COPY --chmod=+x test/browser/run-tests.sh /run-tests.sh
COPY tsconfig.json ./
COPY src/config/paths.ts ./src/config/paths.ts
COPY test/browser ./test/browser

ENTRYPOINT ["/run-tests.sh"]
