FROM mcr.microsoft.com/playwright:v1.61.0-noble@sha256:57b65fdc9ceabe0ef613124c7bbe2babcf9362c4d85e382fe3b03604e84b428a

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip \
  && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip.sig" -o awscliv2.sig \
  && gpg --keyserver hkps://keyserver.ubuntu.com --recv-keys FB5DB77FD5C118B80511ADA8A6310ACC4672475C \
  && gpg --verify awscliv2.sig awscliv2.zip \
  && python3 -m zipfile -e awscliv2.zip . \
  && chmod +x ./aws/install \
  && ./aws/install \
  && chmod +x /usr/local/bin/aws \
  && rm -rf awscliv2.zip awscliv2.sig aws

WORKDIR /tests

COPY package.json package-lock.json ./
RUN npm ci

# run-tests.sh must be in the container root and made executable
COPY --chmod=+x test/browser/run-tests.sh /run-tests.sh
COPY test/browser .

ENTRYPOINT ["/run-tests.sh"]
