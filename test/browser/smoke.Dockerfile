FROM mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27

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
